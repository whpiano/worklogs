'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function NavBar() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            📋 今日任务
          </Link>
          <Link
            href="/bookmarks"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/bookmarks'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            🔖 常用网址
          </Link>
        </div>
        <button
          onClick={logout}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          退出
        </button>
      </div>
    </nav>
  );
}