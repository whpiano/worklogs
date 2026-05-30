import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

/** 创建或获取分类，返回 id */
async function ensureCategory(name: string): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('分类名称不能为空');

  const { data: existing } = await client
    .from('categories')
    .select('id')
    .eq('name', trimmed)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await client
    .from('categories')
    .insert({ name: trimmed })
    .select('id')
    .single();

  if (error) throw new Error(`创建分类失败: ${error.message}`);
  return created.id;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, url, categories: categoryNames, note } = body;

    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json(
        { success: false, error: '名称和网址不能为空' },
        { status: 400 }
      );
    }

    // 更新书签基本信息
    const { data: bookmark, error: updateErr } = await client
      .from('bookmarks')
      .update({
        name: name.trim(),
        url: url.trim(),
        note: note?.trim() || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw new Error(`更新书签失败: ${updateErr.message}`);
    if (!bookmark) {
      return NextResponse.json(
        { success: false, error: '书签不存在' },
        { status: 404 }
      );
    }

    // 更新分类关联：先删除旧的，再插入新的
    if (categoryNames !== undefined) {
      await client
        .from('bookmark_categories')
        .delete()
        .eq('bookmark_id', id);

      const cats: string[] = categoryNames;
      for (const cat of cats) {
        const catId = await ensureCategory(cat);
        await client.from('bookmark_categories').insert({
          bookmark_id: bookmark.id,
          category_id: catId,
        });
      }
    }

    // 返回完整数据 - 手动获取分类
    const { data: bcData } = await client
      .from('bookmark_categories')
      .select('category_id')
      .eq('bookmark_id', bookmark.id);

    let categories: { id: number; name: string }[] = [];
    if (bcData?.length) {
      const ids = bcData.map((r: any) => r.category_id);
      const { data: catData } = await client
        .from('categories')
        .select('id, name')
        .in('id', ids);
      categories = (catData || []).map((c: any) => ({ id: c.id, name: c.name }));
    }

    return NextResponse.json({ success: true, data: { ...bookmark, categories } });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await client
      .from('bookmarks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`删除书签失败: ${error.message}`);

    return NextResponse.json({ success: true, data: null });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}