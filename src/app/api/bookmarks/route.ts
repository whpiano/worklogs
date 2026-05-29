import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = client
      .from('bookmarks')
      .select('*')
      .order('category', { ascending: true })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询书签失败: ${error.message}`);

    return NextResponse.json({ success: true, data: data || [] });
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
    const { name, url, category, note } = body;

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

    const { data, error } = await client
      .from('bookmarks')
      .insert({
        name: name.trim(),
        url: url.trim(),
        category: category?.trim() || '未分类',
        note: note?.trim() || null,
      })
      .select()
      .single();

    if (error) throw new Error(`创建书签失败: ${error.message}`);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}