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

            const currentWeekTasks = data.filter(t => t.workWeek === weekString);
            setTasks(currentWeekTasks);

            // Repeat Task Logic:
            // Only trigger if we are viewing the CURRENT REAL-WORLD WEEK
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const realCurrentDate = new Date(now);
            realCurrentDate.setDate(diff);
            const realCurrentWeekString = realCurrentDate.toISOString().split('T')[0];

            if (weekString === realCurrentWeekString) {
                // 1. Calculate previous week string based on real current week
                const prevDate = new Date(realCurrentDate);
                prevDate.setDate(prevDate.getDate() - 7);
                const prevWeekString = prevDate.toISOString().split('T')[0];

                // 2. Find tasks from previous week that are marked repeatWeekly: true
                const candidates = data.filter(t => t.workWeek === prevWeekString && t.repeatWeekly);

                if (candidates.length > 0) {
                    let addedCount = 0;
                    for (const candidate of candidates) {
                        // 3. Check if already exists in current week (by content + category)
                        const alreadyExists = currentWeekTasks.some(
                            t => t.content === candidate.content && t.category === candidate.category
                        );

                        if (!alreadyExists) {
                            // 4. Add new task
                            await fetch("/api/tasks", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    memberId: candidate.memberId,
                                    content: candidate.content,
                                    weight: candidate.weight,
                                    category: candidate.category,
                                    workWeek: weekString, // Set to THIS week
                                    notes: candidate.notes || "",
                                    priority: candidate.priority,
                                    repeatWeekly: true // Keep repeating
                                }),
                            });
                            addedCount++;
                        }
                    }
                    // If we added tasks, re-fetch or append to state (Refetch is safer to get IDs)
                    if (addedCount > 0) {
                        const reloadRes = await fetch(url);
                        const reloadData: Task[] = await reloadRes.json();
                        setTasks(reloadData.filter(t => t.workWeek === weekString));
                    }
                }
            }

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

    const addTask = async (memberId: string, content: string, weight: number, category: string, priority?: string, repeatWeekly?: boolean, assignedTo?: string, order?: number) => {
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
            priority: (priority as any) || undefined,
            repeatWeekly: repeatWeekly || false,
            assignedTo: assignedTo || undefined,
            order: order || 0,
            isDone: false,
            createdAt: Date.now(),
        };
        setTasks((prev) => [newTask, ...prev]);

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, content, weight, category, workWeek: weekString, notes: "", priority, repeatWeekly, assignedTo, order }),
            });
            if (!res.ok) throw new Error("Failed to add");
            fetchTasks();
        } catch (e) {
            console.error("Add failed", e);
            setTasks((prev) => prev.filter((t) => t.id !== tempId));
        }
    };

    // ... existing toggleTask ...



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

    const editTask = async (taskId: string, updates: { content?: string; weight?: number; category?: string; notes?: string; priority?: string; repeatWeekly?: boolean; assignedTo?: string; order?: number }) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Optimistic Update
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, ...updates, category: (updates.category ?? t.category) as any, priority: (updates.priority ?? t.priority) as any } : t))
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

    const reorderTasks = async (newOrderTasks: Task[]) => {
        // Optimistic Update
        setTasks(newOrderTasks);

        // Prepare updates for API
        const updates = newOrderTasks.map((t, index) => ({
            id: t.id,
            order: index
        }));

        try {
            await fetch("/api/tasks/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates }),
            });
        } catch (e) {
            console.error("Reorder failed", e);
            fetchTasks(); // Revert
        }
    };

    return { tasks, addTask, toggleTask, deleteTask, editTask, copyTaskToNextWeek, copyAllPendingToNextWeek, reorderTasks, clearDone, isLoaded, isLoading };
}
