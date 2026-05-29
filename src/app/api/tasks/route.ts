import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const taskType = searchParams.get('task_type');

    const today = new Date(date);
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
    const dayOfMonth = today.getDate();

    let query = client
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (taskType) {
      query = query.eq('task_type', taskType);
    }

    const { data: allTasks, error } = await query;
    if (error) throw new Error(`查询任务失败: ${error.message}`);

    // 筛选今日应显示的任务
    const todayTasks = (allTasks || []).filter((task: any) => {
      if (task.task_type === 'once') {
        return task.start_date === date;
      }
      if (task.task_type === 'daily') {
        return true;
      }
      if (task.task_type === 'weekly') {
        if (!task.start_date) return true;
        const taskDate = new Date(task.start_date);
        return taskDate.getDay() === dayOfWeek;
      }
      if (task.task_type === 'monthly') {
        if (!task.start_date) return true;
        const taskDate = new Date(task.start_date);
        return taskDate.getDate() === dayOfMonth;
      }
      return false;
    });

    // 查询今日已完成的任务ID集合
    const { data: todayCompletions, error: compError } = await client
      .from('task_completions')
      .select('task_id')
      .eq('completed_date', date);

    if (compError) throw new Error(`查询完成记录失败: ${compError.message}`);

    const completedTaskIds = new Set(
      (todayCompletions || []).map((c: any) => c.task_id)
    );

    const tasksWithStatus = todayTasks.map((task: any) => ({
      ...task,
      is_completed_today: completedTaskIds.has(task.id),
    }));

    return NextResponse.json({ success: true, data: tasksWithStatus });
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
    const { title, description, task_type, start_date } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: '任务标题不能为空' },
        { status: 400 }
      );
    }

    if (!['once', 'daily', 'weekly', 'monthly'].includes(task_type)) {
      return NextResponse.json(
        { success: false, error: '无效的任务类型' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        task_type,
        start_date: start_date || null,
      })
      .select()
      .single();

    if (error) throw new Error(`创建任务失败: ${error.message}`);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}