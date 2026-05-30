import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export async function GET() {
  try {
    const { data, error } = await client
      .from('categories')
      .select('id, name, created_at')
      .order('name', { ascending: true });

    if (error) throw new Error(`查询分类失败: ${error.message}`);

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
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('categories')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: '该分类已存在' },
          { status: 409 }
        );
      }
      throw new Error(`创建分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}