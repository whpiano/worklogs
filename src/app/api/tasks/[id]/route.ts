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
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, error: '无效的任务 ID' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.task_type !== undefined) updates.task_type = body.task_type;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.start_date !== undefined) updates.start_date = body.start_date;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .maybeSingle();

    if (error) throw new Error(`更新任务失败: ${error.message}`);
    if (!data) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, error: '无效的任务 ID' },
        { status: 400 }
      );
    }

    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw new Error(`删除任务失败: ${error.message}`);

    return NextResponse.json({ success: true, data: null });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}