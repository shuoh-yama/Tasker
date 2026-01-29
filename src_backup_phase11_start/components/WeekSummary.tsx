"use client";

import { useState, useEffect } from "react";
import { Task } from "@/lib/types";
import { useWeek } from "@/context/WeekContext";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WeekSummaryProps {
    currentWeekTasks: Task[];
}

export function WeekSummary({ currentWeekTasks }: WeekSummaryProps) {
    const { weekString, currentWeek } = useWeek();
    const [prevWeekTasks, setPrevWeekTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Calculate previous week string
    const getPrevWeekString = () => {
        const prev = new Date(currentWeek);
        prev.setDate(prev.getDate() - 7);
        return prev.toISOString().split("T")[0];
    };

    // Fetch previous week's tasks
    useEffect(() => {
        const fetchPrevWeek = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/tasks");
                const allTasks: Task[] = await res.json();
                const prevWeek = getPrevWeekString();
                setPrevWeekTasks(allTasks.filter(t => t.workWeek === prevWeek));
            } catch (e) {
                console.error("Failed to fetch prev week", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrevWeek();
    }, [weekString]);

    // Calculate stats
    const currentTotal = currentWeekTasks.reduce((sum, t) => sum + t.weight, 0);
    const currentPending = currentWeekTasks.filter(t => !t.isDone).reduce((sum, t) => sum + t.weight, 0);
    const currentCompleted = currentWeekTasks.filter(t => t.isDone).reduce((sum, t) => sum + t.weight, 0);

    const prevTotal = prevWeekTasks.reduce((sum, t) => sum + t.weight, 0);
    const prevCompleted = prevWeekTasks.filter(t => t.isDone).reduce((sum, t) => sum + t.weight, 0);

    const diff = currentTotal - prevTotal;
    const completionRate = currentTotal > 0 ? Math.round((currentCompleted / currentTotal) * 100) : 0;
    const prevCompletionRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;

    // Format date range
    const formatDateRange = (mondayDate: Date) => {
        const start = mondayDate;
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Points */}
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="text-xs text-zinc-500 mb-1">今週のポイント</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-white">{currentTotal}</span>
                    <span className="text-sm text-zinc-400">pt</span>
                </div>
                {!isLoading && (
                    <div className={cn(
                        "text-xs mt-2 flex items-center gap-1",
                        diff > 0 ? "text-orange-400" : diff < 0 ? "text-green-400" : "text-zinc-500"
                    )}>
                        {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        先週比 {diff > 0 ? "+" : ""}{diff} pt
                    </div>
                )}
            </div>

            {/* Pending */}
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="text-xs text-zinc-500 mb-1">未完了</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-yellow-400">{currentPending}</span>
                    <span className="text-sm text-zinc-400">pt</span>
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                    {currentWeekTasks.filter(t => !t.isDone).length} タスク
                </div>
            </div>

            {/* Completed */}
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="text-xs text-zinc-500 mb-1">完了</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-green-400">{currentCompleted}</span>
                    <span className="text-sm text-zinc-400">pt</span>
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                    {currentWeekTasks.filter(t => t.isDone).length} タスク
                </div>
            </div>

            {/* Completion Rate */}
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="text-xs text-zinc-500 mb-1">完了率</div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-blue-400">{completionRate}</span>
                    <span className="text-sm text-zinc-400">%</span>
                </div>
                {!isLoading && prevTotal > 0 && (
                    <div className="text-xs text-zinc-500 mt-2">
                        先週: {prevCompletionRate}%
                    </div>
                )}
            </div>
        </div>
    );
}
