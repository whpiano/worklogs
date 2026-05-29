import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { url, note } = body;

    if (!url?.trim() && !note?.trim()) {
      return NextResponse.json(
        { success: false, error: '请填写网址或完成说明' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await client
      .from('task_completions')
      .insert({
        task_id: taskId,
        url: url?.trim() || null,
        note: note?.trim() || null,
        completed_date: today,
      })
      .select()
      .single();

    if (error) throw new Error(`完成任务失败: ${error.message}`);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}