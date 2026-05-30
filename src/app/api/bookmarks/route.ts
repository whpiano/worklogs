import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

/** 创建或获取分类，返回 id */
async function ensureCategory(name: string): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('分类名称不能为空');

  // 尝试查找
  const { data: existing } = await client
    .from('categories')
    .select('id')
    .eq('name', trimmed)
    .maybeSingle();

  if (existing) return existing.id;

  // 创建新分类
  const { data: created, error } = await client
    .from('categories')
    .insert({ name: trimmed })
    .select('id')
    .single();

  if (error) throw new Error(`创建分类失败: ${error.message}`);
  return created.id;
}

/** 获取指定书签的分类列表 */
async function getCategoriesForBookmark(bookmarkId: number) {
  const { data, error } = await client
    .from('bookmark_categories')
    .select('category_id')
    .eq('bookmark_id', bookmarkId);

  if (error || !data?.length) return [];

  const ids = data.map((r: any) => r.category_id);
  const { data: cats } = await client
    .from('categories')
    .select('id, name')
    .in('id', ids);

  return (cats || []).map((c: any) => ({ id: c.id, name: c.name }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    let filterIds: number[] | undefined;

    if (category) {
      const { data: catData } = await client
        .from('categories')
        .select('id')
        .eq('name', category)
        .maybeSingle();

      if (catData) {
        const { data: bcData } = await client
          .from('bookmark_categories')
          .select('bookmark_id')
          .eq('category_id', catData.id);
        filterIds = (bcData || []).map((r: any) => r.bookmark_id);
      }

      if (!filterIds?.length) {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    let query = client
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterIds) {
      query = query.in('id', filterIds);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询书签失败: ${error.message}`);

    const result = await Promise.all(
      (data || []).map(async (bookmark: any) => {
        const categories = await getCategoriesForBookmark(bookmark.id);
        return { ...bookmark, categories };
      })
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, categories: categoryNames, note } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: '网站名称不能为空' },
        { status: 400 }
      );
    }
    if (!url?.trim()) {
      return NextResponse.json(
        { success: false, error: '网址不能为空' },
        { status: 400 }
      );
    }

    // 创建书签
    const { data: bookmark, error: insertErr } = await client
      .from('bookmarks')
      .insert({
        name: name.trim(),
        url: url.trim(),
        note: note?.trim() || null,
      })
      .select()
      .single();

    if (insertErr) throw new Error(`创建书签失败: ${insertErr.message}`);

    // 处理分类
    const cats: string[] = categoryNames || [];
    for (const cat of cats) {
      const catId = await ensureCategory(cat);
      await client.from('bookmark_categories').insert({
        bookmark_id: bookmark.id,
        category_id: catId,
      });
    }

    // 返回完整数据
    const categories = await getCategoriesForBookmark(bookmark.id);

    return NextResponse.json(
      { success: true, data: { ...bookmark, categories } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}