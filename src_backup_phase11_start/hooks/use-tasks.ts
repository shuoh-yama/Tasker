"use client";

import { useState, useEffect } from "react";
import { Task, TeamMemberId } from "@/lib/types";

import { useWeek } from "@/context/WeekContext";

export function useTasks(filterEmail?: string) {
    const { weekString } = useWeek();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function fetchTasks() {
        try {
            setIsLoading(true);
            const url = filterEmail ? `/api/tasks?email=${filterEmail}` : "/api/tasks";
            const res = await fetch(url);
            const data: Task[] = await res.json();

            // Client-side week filtering for now
            const weeklyTasks = data.filter(t => t.workWeek === weekString || (!t.workWeek && weekString === "2025-01-27")); // Handle legacy?
            // Better: just filter strict. If legacy data has no week, it won't show.
            // Or default legacy to current week?
            // Let's filter strict: t.workWeek === weekString.
            // But for existing data, they are undefined.
            // Let's infer for now or show all if undefined?
            // User requested "Previous" tasks to disappear. So strict filter is best.
            // Since we just added column, old tasks have no value. They might disappear.
            // That's acceptable for "New feature".

            setTasks(data.filter(t => t.workWeek === weekString));
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        } finally {
            setIsLoading(false);
            setIsLoaded(true);
        }
    }

    // Load from API on mount or week change
    useEffect(() => {
        fetchTasks();
    }, [filterEmail, weekString]);

    const addTask = async (memberId: string, content: string, weight: number, category: string) => {
        // Optimistic Update
        const tempId = crypto.randomUUID();
        const newTask: Task = {
            id: tempId,
            memberId,
            content,
            weight,
            category: (category as any) || 'other',
            workWeek: weekString,
            notes: "",
            isDone: false,
            createdAt: Date.now(),
        };
        setTasks((prev) => [newTask, ...prev]);

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, content, weight, category, workWeek: weekString, notes: "" }),
            });
            if (!res.ok) throw new Error("Failed to add");
            fetchTasks();
        } catch (e) {
            console.error("Add failed", e);
            setTasks((prev) => prev.filter((t) => t.id !== tempId));
        }
    };

    const toggleTask = async (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Optimistic Update
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, isDone: !t.isDone } : t))
        );

        try {
            await fetch("/api/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: taskId, isDone: !task.isDone }),
            });
        } catch (e) {
            console.error("Toggle failed", e);
            // Revert
            setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, isDone: task.isDone } : t))
            );
        }
    };

    const deleteTask = async (taskId: string) => {
        // Optimistic Update
        const oldTasks = tasks;
        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        try {
            await fetch(`/api/tasks?id=${taskId}`, {
                method: "DELETE",
            });
        } catch (e) {
            console.error("Delete failed", e);
            setTasks(oldTasks);
        }
    };

    const clearDone = async () => {
        // This logic is complex with API. 
        // We would need to delete multiple.
        // For V1, let's just delete them one by one or fetch refresh.
        // Implementing client-side loop for simplicity in V1
        const doneTasks = tasks.filter(t => t.isDone);

        // Optimistic
        setTasks(prev => prev.filter(t => !t.isDone));

        for (const task of doneTasks) {
            await deleteTask(task.id);
            // Note: calling deleteTask above also triggers fetch, might be chatty.
            // But deleteTask definition above handles API call.
            // Actually, the above deleteTask updates state too.
            // Let's just rely on that.
        }
    };

    const editTask = async (taskId: string, updates: { content?: string; weight?: number; category?: string; notes?: string }) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Optimistic Update
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, ...updates, category: (updates.category ?? t.category) as any } : t))
        );

        try {
            await fetch("/api/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: taskId, ...updates }),
            });
        } catch (e) {
            console.error("Edit failed", e);
            // Revert
            setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? task : t))
            );
        }
    };

    // Helper to get next week's Monday
    const getNextWeekString = () => {
        const current = new Date(weekString);
        current.setDate(current.getDate() + 7);
        return current.toISOString().split("T")[0];
    };

    const copyTaskToNextWeek = async (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const nextWeek = getNextWeekString();

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberId: task.memberId,
                    content: task.content,
                    weight: task.weight,
                    category: task.category,
                    workWeek: nextWeek
                }),
            });
            if (!res.ok) throw new Error("Failed to copy");
            // Optionally refresh or notify
        } catch (e) {
            console.error("Copy task failed", e);
        }
    };

    const copyAllPendingToNextWeek = async () => {
        const pendingTasks = tasks.filter(t => !t.isDone);
        const nextWeek = getNextWeekString();

        for (const task of pendingTasks) {
            try {
                await fetch("/api/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        memberId: task.memberId,
                        content: task.content,
                        weight: task.weight,
                        category: task.category,
                        workWeek: nextWeek
                    }),
                });
            } catch (e) {
                console.error("Copy task failed", e);
            }
        }
    };

    return { tasks, addTask, toggleTask, deleteTask, editTask, copyTaskToNextWeek, copyAllPendingToNextWeek, clearDone, isLoaded, isLoading };
}
