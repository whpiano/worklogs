import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, url, category, note } = body;

    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json(
        { success: false, error: '名称和网址不能为空' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('bookmarks')
      .update({
        name: name.trim(),
        url: url.trim(),
        category: category?.trim() || '未分类',
        note: note?.trim() || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新书签失败: ${error.message}`);
    if (!data) {
      return NextResponse.json(
        { success: false, error: '书签不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
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