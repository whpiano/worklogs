'use client';

import { useState, useEffect, useCallback } from 'react';

interface Bookmark {
  id: number;
  name: string;
  url: string;
  category: string;
  note: string | null;
  created_at: string;
}

function groupByCategory(bookmarks: Bookmark[]): Record<string, Bookmark[]> {
  const groups: Record<string, Bookmark[]> = {};
  for (const b of bookmarks) {
    const cat = b.category || '未分类';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(b);
  }
  return groups;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [form, setForm] = useState({ name: '', url: '', category: '', note: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch('/api/bookmarks');
      const data = await res.json();
      if (data.success) setBookmarks(data.data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', url: '', category: '', note: '' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (b: Bookmark) => {
    setEditing(b);
    setForm({ name: b.name, url: b.url, category: b.category, note: b.note || '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      setError('名称和网址不能为空');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const url = editing
        ? `/api/bookmarks/${editing.id}`
        : '/api/bookmarks';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        setEditing(null);
        fetchBookmarks();
      } else {
        setError(data.error || '操作失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这个书签吗？')) return;
    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchBookmarks();
    } catch {}
  };

  const categories = Object.entries(groupByCategory(bookmarks)).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">🔖 常用网址</h1>
          <p className="text-sm text-zinc-500 mt-1">收藏和管理你常用的网站</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加网址
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-lg p-6"
          >
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              {editing ? '编辑书签' : '添加书签'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">网站名称 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如：知乎日报"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">网址 *</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">分类</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="如：资讯、工具、设计（留空默认为未分类）"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">备注</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="简短描述这个网站的用途..."
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? '保存中...' : editing ? '保存修改' : '添加'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">加载中...</div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <p className="text-zinc-500">还没有收藏网址</p>
          <button onClick={openCreate} className="mt-3 text-sm text-zinc-900 underline underline-offset-2 hover:text-zinc-600">
            添加第一个书签
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(([category, items]) => (
            <section key={category}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-zinc-800">{category}</h2>
                <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="group relative bg-white border border-zinc-200 rounded-xl p-4 hover:shadow-md hover:border-zinc-300 transition-all"
                  >
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h3 className="font-medium text-zinc-900 truncate pr-6">{bookmark.name}</h3>
                      <p className="text-xs text-zinc-400 truncate mt-1">{bookmark.url}</p>
                      {bookmark.note && (
                        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{bookmark.note}</p>
                      )}
                    </a>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(bookmark)}
                        className="w-7 h-7 bg-white border border-zinc-200 rounded-lg flex items-center justify-center hover:bg-zinc-50 transition-colors"
                        title="编辑"
                      >
                        <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(bookmark.id)}
                        className="w-7 h-7 bg-white border border-zinc-200 rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="删除"
                      >
                        <svg className="w-3.5 h-3.5 text-zinc-500 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}