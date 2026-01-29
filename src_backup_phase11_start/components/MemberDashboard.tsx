"use client";

import { useState, useEffect } from "react";
import { Task } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle, Circle, Pencil, X, Save, CopyPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/use-categories";

interface MemberDashboardProps {
    memberId: string;
    memberMaxPoints?: number;
    tasks: Task[];
    onAddTask: (memberId: string, content: string, weight: number, category: string) => void;
    onToggleTask: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
    onEditTask?: (taskId: string, updates: { content?: string; weight?: number; category?: string; notes?: string }) => void;
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
    const { categories, isLoaded: categoriesLoaded, getDefaultPoints } = useCategories();

    // Edit mode state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editWeight, setEditWeight] = useState(1);
    const [editCategory, setEditCategory] = useState("");
    const [editNotes, setEditNotes] = useState("");

    // Calculate current points (incomplete tasks only)
    const currentPoints = tasks.filter(t => !t.isDone).reduce((sum, t) => sum + t.weight, 0);
    const isOverLimit = currentPoints > memberMaxPoints;

    // Set default category when categories load
    useEffect(() => {
        if (categoriesLoaded && categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0].id);
            setWeight(categories[0].defaultPoints);
        }
    }, [categoriesLoaded, categories, selectedCategory]);

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setWeight(getDefaultPoints(categoryId));
        // Auto-fill template: "(作品名) カテゴリ名"
        const categoryName = categories.find(c => c.id === categoryId)?.name || categoryId;
        setContent(`(作品名) ${categoryName}`);
    };

    const handleAdd = () => {
        if (!content.trim() || !selectedCategory) return;
        onAddTask(memberId, content, weight, selectedCategory);
        setContent("");
    };

    const startEdit = (task: Task) => {
        setEditingId(task.id);
        setEditContent(task.content);
        setEditWeight(task.weight);
        setEditCategory(task.category);
        setEditNotes(task.notes || "");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent("");
        setEditWeight(1);
        setEditCategory("");
        setEditNotes("");
    };

    const saveEdit = () => {
        if (!editingId || !onEditTask) return;
        onEditTask(editingId, { content: editContent, weight: editWeight, category: editCategory, notes: editNotes });
        cancelEdit();
    };

    const getCategoryName = (categoryId: string) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name ?? categoryId;
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
                <span className="text-zinc-500">現在のポイント:</span>
                <span className={cn(
                    "font-bold text-lg",
                    isOverLimit ? "text-red-500" : currentPoints > memberMaxPoints * 0.8 ? "text-orange-500" : "text-green-500"
                )}>
                    {currentPoints} / {memberMaxPoints} pt
                </span>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4 shadow-lg backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
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
                            className="bg-zinc-950 border-zinc-800 focus:ring-blue-500/50 text-white placeholder:text-zinc-500 h-10"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="w-32">
                            <select
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id} className="bg-zinc-900">
                                        {cat.name} ({cat.defaultPoints}pt)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button
                            onClick={handleAdd}
                            className="bg-blue-600 hover:bg-blue-500 text-white h-10 px-6 font-medium shadow-blue-900/20 shadow-lg transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5 mr-1" /> 追加
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 px-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">ポイント</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((pt) => (
                            <button
                                key={pt}
                                onClick={() => setWeight(pt)}
                                className={cn(
                                    "w-10 h-10 rounded-lg font-bold transition-all border",
                                    weight === pt
                                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20 scale-110"
                                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
                                )}
                            >
                                {pt}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-zinc-600">（カテゴリ選択で自動設定）</span>
                </div>
            </div>

            <div className="space-y-3">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className={cn(
                            "group flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 transition-all hover:bg-zinc-900/80 hover:border-zinc-700",
                            task.isDone && "opacity-50 grayscale"
                        )}
                    >
                        {editingId === task.id ? (
                            // Edit Mode - Card Layout
                            <div className="flex flex-col gap-3 w-full">
                                {/* Top Row: Content, Category, Weight, Actions */}
                                <div className="flex items-center gap-3">
                                    <Input
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="flex-1 bg-zinc-950 border-zinc-700 text-white h-9"
                                        placeholder="タスク内容"
                                    />
                                    <select
                                        value={editCategory}
                                        onChange={(e) => {
                                            setEditCategory(e.target.value);
                                            setEditWeight(getDefaultPoints(e.target.value));
                                        }}
                                        className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((pt) => (
                                            <button
                                                key={pt}
                                                onClick={() => setEditWeight(pt)}
                                                className={cn(
                                                    "w-7 h-7 rounded text-xs font-bold transition-all border",
                                                    editWeight === pt
                                                        ? "bg-blue-600 border-blue-500 text-white"
                                                        : "bg-zinc-900 border-zinc-700 text-zinc-500"
                                                )}
                                            >
                                                {pt}
                                            </button>
                                        ))}
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={saveEdit} className="text-green-500 hover:text-green-400 h-8">
                                        <Save className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-zinc-500 hover:text-zinc-400 h-8">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                {/* Bottom Row: Full-width Notes Input */}
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    placeholder="📝 メモを入力..."
                                    rows={2}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
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
                                            task.isDone ? "text-green-500" : "text-zinc-600 group-hover:text-zinc-400"
                                        )}
                                    >
                                        {task.isDone ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn(
                                            "text-lg font-medium",
                                            task.isDone ? "text-zinc-500 line-through" : "text-zinc-100"
                                        )}>
                                            {task.content}
                                        </div>
                                        <div className="text-sm text-zinc-500 flex items-center gap-3 mt-1">
                                            <span className="text-blue-400 font-semibold">{getCategoryName(task.category)}</span>
                                            <span>•</span>
                                            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 ml-auto">
                                                {task.weight}pt
                                            </Badge>
                                        </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {onEditTask && !task.isDone && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => startEdit(task)}
                                                className="text-zinc-600 hover:text-blue-500 hover:bg-blue-500/10 h-8 w-8"
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
                                                className="text-zinc-600 hover:text-purple-500 hover:bg-purple-500/10 h-8 w-8"
                                                title="来週にコピー"
                                            >
                                                <CopyPlus className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteTask(task.id)}
                                            className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                {/* Notes Section - More Prominent */}
                                {task.notes && (
                                    <div className="ml-10 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                                        <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                                            📝 メモ
                                        </div>
                                        <div className="text-sm text-zinc-300">
                                            {task.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 mb-4">
                            <CheckCircle className="w-6 h-6 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500">タスクがありません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
