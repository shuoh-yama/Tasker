"use client";

import { useState, useEffect } from "react";
import { Task } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle, Circle, Pencil, X, Save, CopyPlus, Repeat, Flag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/use-categories";
import { useMembers } from "@/hooks/use-members";
import { renderContentWithMentions } from "@/utils/mentions";

interface MemberDashboardProps {
    memberId: string;
    memberMaxPoints?: number;
    tasks: Task[];
    onAddTask: (memberId: string, content: string, weight: number, category: string, priority?: string, repeatWeekly?: boolean, assignedTo?: string) => void;
    onToggleTask: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
    onEditTask?: (taskId: string, updates: { content?: string; weight?: number; category?: string; notes?: string; priority?: string; repeatWeekly?: boolean; assignedTo?: string; order?: number }) => void;
    onCopyToNextWeek?: (taskId: string) => void;
}

export function MemberDashboard({
    memberId,
    memberMaxPoints = 15,
    tasks,
    onAddTask,
    onToggleTask,
    onDeleteTask,
    onEditTask,
    onCopyToNextWeek,
}: MemberDashboardProps) {
    const [content, setContent] = useState("");
    const [weight, setWeight] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [priority, setPriority] = useState<string>("mid");
    const [repeatWeekly, setRepeatWeekly] = useState(false);
    const [assignedTo, setAssignedTo] = useState<string>(memberId);
    const { categories, isLoaded: categoriesLoaded, getDefaultPoints } = useCategories();
    const { members } = useMembers();

    // Edit mode state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editWeight, setEditWeight] = useState(1);
    const [editCategory, setEditCategory] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [editPriority, setEditPriority] = useState<string>("mid");
    const [editRepeatWeekly, setEditRepeatWeekly] = useState(false);
    const [editAssignedTo, setEditAssignedTo] = useState<string>("");

    // Calculate current points (incomplete tasks only)
    // Separate active and completed tasks
    const activeTasks = tasks.filter(t => !t.isDone).sort((a, b) => {
        // Priority (Descending: High > Mid > Low > None)
        const getPrioVal = (p?: string) => {
            if (p === 'high') return 3;
            if (p === 'mid') return 2;
            if (p === 'low') return 1;
            return 0;
        };
        const prioDiff = getPrioVal(b.priority) - getPrioVal(a.priority);
        if (prioDiff !== 0) return prioDiff;

        // Weight (Descending: Big > Small)
        const weightDiff = b.weight - a.weight;
        if (weightDiff !== 0) return weightDiff;

        // Final tiebreaker: created time (Newer first? or Older first?)
        // Let's go Newer First (Desc)
        return (b.createdAt || 0) - (a.createdAt || 0);
    });
    const completedTasks = tasks.filter(t => t.isDone);

    const currentPoints = activeTasks.reduce((sum, t) => sum + t.weight, 0);
    const isOverLimit = currentPoints > memberMaxPoints;

    // Set default category when categories load
    useEffect(() => {
        if (categoriesLoaded && categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0].id);
            setWeight(categories[0].defaultPoints);
        }
    }, [categoriesLoaded, categories, selectedCategory]);

    // Update default assignedTo when memberId changes
    useEffect(() => {
        setAssignedTo(memberId);
    }, [memberId]);

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setWeight(getDefaultPoints(categoryId));
    };

    const handleAdd = () => {
        if (!content.trim() || !selectedCategory) return;
        onAddTask(memberId, content, weight, selectedCategory, priority, repeatWeekly, assignedTo);
        setContent("");
        // Reset defaults
        setPriority("mid");
        setRepeatWeekly(false);
        setAssignedTo(memberId);
    };

    const startEdit = (task: Task) => {
        setEditingId(task.id);
        setEditContent(task.content);
        setEditWeight(task.weight);
        setEditCategory(task.category);
        setEditNotes(task.notes || "");
        setEditPriority(task.priority || "mid");
        setEditRepeatWeekly(task.repeatWeekly || false);
        setEditAssignedTo(task.assignedTo || task.memberId);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent("");
        setEditWeight(1);
        setEditCategory("");
        setEditNotes("");
        setEditPriority("mid");
        setEditRepeatWeekly(false);
        setEditAssignedTo("");
    };

    const saveEdit = () => {
        if (!editingId || !onEditTask) return;
        onEditTask(editingId, {
            content: editContent,
            weight: editWeight,
            category: editCategory,
            notes: editNotes,
            priority: editPriority,
            repeatWeekly: editRepeatWeekly,
            assignedTo: editAssignedTo
        });
        cancelEdit();
    };

    const getCategoryName = (categoryId: string) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name ?? categoryId;
    };

    const getPriorityColor = (p?: string) => {
        switch (p) {
            case 'high': return "text-red-500 bg-red-500/10 border-red-500/20";
            case 'low': return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            default: return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"; // mid
        }
    };

    return (
        <div className="space-y-6">
            {/* Point Limit Warning */}
            {isOverLimit && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm flex items-center gap-2">
                    <span className="font-bold">⚠️ 警告:</span>
                    現在のポイント ({currentPoints}pt) が上限 ({memberMaxPoints}pt) を超えています
                </div>
            )}

            {/* Current Points Display */}
            <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">現在のポイント:</span>
                <span className={cn(
                    "font-bold text-lg",
                    isOverLimit ? "text-destructive" : currentPoints > memberMaxPoints * 0.8 ? "text-orange-500" : "text-green-500"
                )}>
                    {currentPoints} / {memberMaxPoints} pt
                </span>
            </div>

            <div id="task-input-area" className="p-4 rounded-xl border border-border bg-card space-y-4 shadow-lg backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                        <Input
                            placeholder="タスクを追加..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                    e.preventDefault();
                                    handleAdd();
                                }
                            }}
                            className="bg-background border-input focus:ring-ring text-foreground placeholder:text-muted-foreground h-10"
                        />

                        <div className="flex items-center gap-3">
                            {/* Priority Selection */}
                            <div className="flex items-center gap-1 bg-background border border-input rounded-md p-1 h-9">
                                {['high', 'mid', 'low'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={cn(
                                            "p-1 rounded hover:bg-muted transition-colors",
                                            priority === p && "bg-muted shadow-sm"
                                        )}
                                        title={`Priority: ${p}`}
                                    >
                                        <Flag className={cn(
                                            "w-4 h-4",
                                            p === 'high' ? "text-red-500" : p === 'low' ? "text-blue-500" : "text-yellow-500",
                                            priority === p && "fill-current"
                                        )} />
                                    </button>
                                ))}
                            </div>

                            {/* Repeat Toggle */}
                            <button
                                onClick={() => setRepeatWeekly(!repeatWeekly)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 h-9 rounded-md border text-sm font-medium transition-all",
                                    repeatWeekly
                                        ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                                        : "bg-background border-input text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Repeat className="w-4 h-4" />
                                {repeatWeekly ? "毎週" : "1回"}
                            </button>

                            {/* Assignee Selection */}
                            <div className="relative">
                                <select
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    className="h-9 w-32 rounded-md border border-input bg-background px-2 pl-8 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <User className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="w-40">
                            <select
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id} className="bg-popover">
                                        {cat.name} ({cat.defaultPoints}pt)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button
                            onClick={handleAdd}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-full font-medium shadow-lg transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5 mr-1" /> 追加
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 px-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ポイント</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((pt) => (
                            <button
                                key={pt}
                                onClick={() => setWeight(pt)}
                                className={cn(
                                    "w-10 h-10 rounded-lg font-bold transition-all border",
                                    weight === pt
                                        ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110"
                                        : "bg-background border-input text-muted-foreground hover:bg-muted hover:border-input hover:text-foreground"
                                )}
                            >
                                {pt}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">（カテゴリ選択で自動設定）</span>
                </div>
            </div>

            <div id="tasks-list" className="space-y-3">


                {activeTasks.map((task) => (
                    <div
                        key={task.id}
                        className={cn(
                            "group flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-card/80 bg-card/40 border-border hover:border-foreground/20",
                            // Priority Border hint on left
                            task.priority === 'high' && "border-l-4 border-l-red-500",
                            task.priority === 'mid' && "border-l-4 border-l-yellow-600",
                            task.priority === 'low' && "border-l-4 border-l-blue-500"
                        )}
                    >

                        {editingId === task.id ? (
                            // Edit Mode - Card Layout
                            <div className="flex flex-col gap-3 w-full">
                                {/* Top Row: Content, Category, Weight, Actions */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <Input
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="flex-1 bg-background border-input text-foreground h-9 min-w-[200px]"
                                        placeholder="タスク内容"
                                    />
                                    <select
                                        value={editCategory}
                                        onChange={(e) => {
                                            setEditCategory(e.target.value);
                                            setEditWeight(getDefaultPoints(e.target.value));
                                        }}
                                        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>

                                    {/* Priority Edit */}
                                    <div className="flex items-center gap-1 bg-background border border-input rounded-md p-0.5 h-9">
                                        {['high', 'mid', 'low'].map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setEditPriority(p)}
                                                className={cn(
                                                    "p-1 rounded hover:bg-muted transition-colors",
                                                    editPriority === p && "bg-muted"
                                                )}
                                            >
                                                <Flag className={cn(
                                                    "w-3.5 h-3.5",
                                                    p === 'high' ? "text-red-500" : p === 'low' ? "text-blue-500" : "text-yellow-500",
                                                    editPriority === p && "fill-current"
                                                )} />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Repeat Edit */}
                                    <button
                                        onClick={() => setEditRepeatWeekly(!editRepeatWeekly)}
                                        className={cn(
                                            "flex items-center justify-center w-9 h-9 rounded-md border transition-all",
                                            editRepeatWeekly
                                                ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                                                : "bg-background border-input text-muted-foreground"
                                        )}
                                        title="毎週リピート"
                                    >
                                        <Repeat className="w-4 h-4" />
                                    </button>

                                    {/* Assignee Edit */}
                                    <div className="relative">
                                        <select
                                            value={editAssignedTo}
                                            onChange={(e) => setEditAssignedTo(e.target.value)}
                                            className="h-9 w-28 rounded-md border border-input bg-background px-2 pl-7 text-xs text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                        <User className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    </div>

                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((pt) => (
                                            <button
                                                key={pt}
                                                onClick={() => setEditWeight(pt)}
                                                className={cn(
                                                    "w-7 h-7 rounded text-xs font-bold transition-all border",
                                                    editWeight === pt
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "bg-background border-input text-muted-foreground"
                                                )}
                                            >
                                                {pt}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1 ml-auto">
                                        <Button size="sm" variant="ghost" onClick={saveEdit} className="text-green-500 hover:text-green-400 h-8 w-8 p-0">
                                            <Save className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-muted-foreground hover:text-foreground h-8 w-8 p-0">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                {/* Bottom Row: Full-width Notes Input */}
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    placeholder="📝 メモを入力..."
                                    rows={2}
                                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                />
                            </div>
                        ) : (
                            // View Mode - Large Card Layout
                            <div className="flex flex-col gap-3 w-full">
                                <div className="flex items-start gap-4">
                                    <button
                                        onClick={() => onToggleTask(task.id)}
                                        className={cn(
                                            "flex-shrink-0 transition-colors duration-200 mt-0.5",
                                            task.isDone ? "text-green-500" : "text-muted-foreground group-hover:text-foreground"
                                        )}
                                    >
                                        {task.isDone ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn(
                                            "text-lg font-medium flex items-center gap-2 flex-wrap",
                                            task.isDone ? "text-muted-foreground line-through" : "text-foreground"
                                        )}>
                                            {task.content}
                                            {task.repeatWeekly && (
                                                <Repeat className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                            )}
                                            {task.priority && (
                                                <Badge variant="outline" className={cn("text-xs px-1.5 py-0 h-5 border-0 font-bold", getPriorityColor(task.priority))}>
                                                    {task.priority.toUpperCase()}
                                                </Badge>
                                            )}
                                            {/* Assignment Indicator */}
                                            {task.assignedTo && task.assignedTo !== memberId && (
                                                <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-xs border border-border">
                                                    <span className="text-muted-foreground">→</span>
                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-foreground font-medium">
                                                        {members.find(m => m.id === task.assignedTo)?.name || task.assignedTo}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                            <span className="text-blue-400 font-semibold">{getCategoryName(task.category)}</span>
                                            <span>•</span>
                                            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 ml-auto">
                                                {task.weight}pt
                                            </Badge>
                                        </div>
                                        {/* Notes with Mentions */}
                                        {task.notes && (
                                            <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded border border-border whitespace-pre-wrap">
                                                {renderContentWithMentions(task.notes)}
                                            </div>
                                        )}
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {onEditTask && !task.isDone && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => startEdit(task)}
                                                className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 h-8 w-8"
                                                title="編集"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {onCopyToNextWeek && !task.isDone && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onCopyToNextWeek(task.id)}
                                                className="text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 h-8 w-8"
                                                title="来週にコピー"
                                            >
                                                <CopyPlus className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteTask(task.id)}
                                            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                ))}

                {/* Completed Tasks (No Drag & Drop) */}
                {
                    completedTasks.length > 0 && (
                        <div className="pt-4 border-t border-border mt-6">
                            <h3 className="text-muted-foreground text-sm font-medium mb-3">完了済み</h3>
                            <div className="space-y-3 opacity-60">
                                {completedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="group flex items-center justify-between p-4 rounded-xl border bg-muted/20 border-border"
                                    >
                                        {/* Simplified View for Completed */}
                                        {/* We can re-use the same structure or simplify. Re-using simplified structure for safety/conciseness */}
                                        <div className="flex flex-col gap-3 w-full">
                                            <div className="flex items-start gap-4">
                                                <button
                                                    onClick={() => onToggleTask(task.id)}
                                                    className="flex-shrink-0 text-green-500 mt-0.5"
                                                >
                                                    <CheckCircle className="w-6 h-6" />
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-lg font-medium text-muted-foreground line-through flex items-center gap-2 flex-wrap">
                                                        {task.content}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                                        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                                                            {task.weight}pt
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDeleteTask(task.id)}
                                                        className="text-muted-foreground hover:text-red-500 h-8 w-8"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {
                    activeTasks.length === 0 && completedTasks.length === 0 && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                                <CheckCircle className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">タスクがありません</p>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
