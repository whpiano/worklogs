import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const date = searchParams.get('date');

    let query = client
      .from('task_completions')
      .select('*, tasks(title, task_type)')
      .order('created_at', { ascending: false });

    if (taskId) {
      const id = parseInt(taskId, 10);
      if (!isNaN(id)) {
        query = query.eq('task_id', id);
      }
    }

    if (date) {
      query = query.eq('completed_date', date);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询完成记录失败: ${error.message}`);

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}