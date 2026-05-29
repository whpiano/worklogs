'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Plus,
  CalendarDays,
  Clock,
  Repeat,
  CheckCircle2,
  Circle,
  Trash2,
  History,
  ExternalLink,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string | null;
  task_type: 'once' | 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  start_date: string | null;
  created_at: string;
  updated_at: string;
  is_completed_today: boolean;
}

interface Completion {
  id: number;
  task_id: number;
  url: string | null;
  note: string | null;
  completed_date: string;
  created_at: string;
  tasks: { title: string; task_type: string } | null;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  once: '单次',
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
};

const TASK_TYPE_ICONS: Record<string, React.ReactNode> = {
  once: <CalendarDays className="w-3 h-3" />,
  daily: <RotateCcw className="w-3 h-3" />,
  weekly: <Repeat className="w-3 h-3" />,
  monthly: <Clock className="w-3 h-3" />,
};

const TASK_TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  once: 'default',
  daily: 'secondary',
  weekly: 'outline',
  monthly: 'secondary',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [today, setToday] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // 创建任务表单
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('once');
  const [newDate, setNewDate] = useState('');

  // 完成任务表单
  const [completeUrl, setCompleteUrl] = useState('');
  const [completeNote, setCompleteNote] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/tasks?date=${date}`);
      const result = await res.json();
      if (result.success) {
        setTasks(result.data);
      }
    } catch (err) {
      console.error('加载任务失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const now = new Date().toISOString().split('T')[0];
    setToday(now);
    setNewDate(now);
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      toast.error('请输入任务标题');
      return;
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc || null,
          task_type: newType,
          start_date: newType === 'once' ? newDate : newDate || null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('任务创建成功');
        setCreateOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewType('once');
        setNewDate(today);
        loadTasks();
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (err) {
      toast.error('创建任务失败');
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    if (!completeUrl.trim() && !completeNote.trim()) {
      toast.error('请填写网址或完成说明');
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: completeUrl || null,
          note: completeNote || null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('任务已完成 🎉');
        setCompleteOpen(false);
        setCompleteUrl('');
        setCompleteNote('');
        setSelectedTask(null);
        loadTasks();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err) {
      toast.error('操作失败');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('确定要删除这个任务吗？')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        toast.success('任务已删除');
        loadTasks();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    }
  };

  const openCompleteDialog = (task: Task) => {
    setSelectedTask(task);
    setCompleteUrl('');
    setCompleteNote('');
    setCompleteOpen(true);
  };

  const openHistoryDialog = async () => {
    setHistoryOpen(true);
    try {
      const res = await fetch('/api/completions');
      const result = await res.json();
      if (result.success) {
        setCompletions(result.data);
      }
    } catch (err) {
      console.error('加载完成记录失败', err);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.is_completed_today);
  const completedTasks = tasks.filter((t) => t.is_completed_today);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <Toaster />
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              工作计划
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={openHistoryDialog}
              className="text-neutral-500"
            >
              <History className="w-4 h-4 mr-1" />
              记录
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              新建任务
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 日期显示 */}
        <div className="mb-6">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">今日</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {today ? formatDate(today) : ''}
          </p>
        </div>

        {/* 进度概览 */}
        {!loading && tasks.length > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              {completedTasks.length}/{tasks.length} 已完成
            </span>
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              今日暂无任务
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs">
              点击下方按钮创建你的第一个任务吧
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              创建任务
            </Button>
          </div>
        ) : (
          /* 任务列表 - Tabs 切换待办/已完成 */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex-1">
                待办 ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">
                已完成 ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3">
              {pendingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => openCompleteDialog(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
              {pendingTasks.length === 0 && (
                <p className="text-center text-sm text-neutral-400 py-8">
                  所有任务已完成！太棒了 🎉
                </p>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  completed
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* 创建任务对话框 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>创建新任务</DialogTitle>
            <DialogDescription>
              创建一个单次任务或循环任务，管理你的每日工作计划
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">任务标题</Label>
              <Input
                id="title"
                placeholder="输入任务标题..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">描述（可选）</Label>
              <Textarea
                id="desc"
                placeholder="输入任务描述..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">任务类型</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">单次任务</SelectItem>
                  <SelectItem value="daily">每日任务</SelectItem>
                  <SelectItem value="weekly">每周任务</SelectItem>
                  <SelectItem value="monthly">每月任务</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">
                {newType === 'once' ? '执行日期' : '开始日期'}
              </Label>
              <Input
                id="date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTask}>创建任务</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 完成任务对话框 */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>完成任务</DialogTitle>
            <DialogDescription>
              为「{selectedTask?.title}」添加完成存档
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="completeUrl">
                相关网址 <span className="text-neutral-400">（可选）</span>
              </Label>
              <Input
                id="completeUrl"
                placeholder="https://..."
                value={completeUrl}
                onChange={(e) => setCompleteUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completeNote">
                完成说明 <span className="text-neutral-400">（可选）</span>
              </Label>
              <Textarea
                id="completeNote"
                placeholder="记录本次完成的要点..."
                value={completeNote}
                onChange={(e) => setCompleteNote(e.target.value)}
                rows={3}
              />
            </div>
            <p className="text-xs text-neutral-400">
              * 网址和说明至少需要填写一项
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCompleteTask}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              确认完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 完成历史对话框 */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>完成记录</DialogTitle>
            <DialogDescription>所有任务的完成存档记录</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {completions.length === 0 ? (
              <div className="text-center py-8 text-sm text-neutral-400">
                暂无完成记录
              </div>
            ) : (
              <div className="space-y-3">
                {completions.map((comp) => (
                  <Card key={comp.id} className="border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                              {comp.tasks?.title || '已删除任务'}
                            </span>
                            {comp.tasks && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {TASK_TYPE_LABELS[comp.tasks.task_type] || comp.tasks.task_type}
                              </Badge>
                            )}
                          </div>
                          {comp.note && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                              {comp.note}
                            </p>
                          )}
                          {comp.url && (
                            <a
                              href={comp.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {comp.url.length > 50
                                ? comp.url.slice(0, 50) + '...'
                                : comp.url}
                            </a>
                          )}
                          <p className="text-[10px] text-neutral-400 mt-1">
                            {comp.completed_date}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 任务卡片组件
function TaskCard({
  task,
  completed = false,
  onComplete,
  onDelete,
}: {
  task: Task;
  completed?: boolean;
  onComplete?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      className={`border transition-all duration-200 ${
        completed
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 完成状态图标 */}
          <div className="mt-0.5">
            {completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <button
                onClick={onComplete}
                className="group cursor-pointer"
                title="完成任务"
              >
                <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-emerald-400 transition-colors" />
              </button>
            )}
          </div>

          {/* 任务内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={`text-sm font-medium truncate ${
                  completed
                    ? 'line-through text-neutral-400 dark:text-neutral-500'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {task.title}
              </h3>
              <Badge
                variant={TASK_TYPE_VARIANTS[task.task_type]}
                className="shrink-0 text-[10px] px-1.5 py-0 gap-1"
              >
                {TASK_TYPE_ICONS[task.task_type]}
                {TASK_TYPE_LABELS[task.task_type]}
              </Badge>
            </div>
            {task.description && (
              <p
                className={`text-xs ${
                  completed
                    ? 'text-neutral-400 dark:text-neutral-500'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {task.description}
              </p>
            )}
          </div>

          {/* 操作按钮 */}
          {!completed && onDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-neutral-300 hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-400 transition-colors"
              title="删除任务"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {completed && onDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-neutral-300 hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-400 transition-colors"
              title="删除任务"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}