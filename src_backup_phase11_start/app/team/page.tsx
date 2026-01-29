"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/use-tasks";
import { useMembers } from "@/hooks/use-members";
import { useCategories } from "@/hooks/use-categories";
import { WorkloadChart } from "@/components/WorkloadChart";
import { WeekTrendChart } from "@/components/WeekTrendChart";
import { WeekSummary } from "@/components/WeekSummary";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function TeamPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { tasks, isLoaded } = useTasks();
    const { getMemberName, members, isLoaded: membersLoaded } = useMembers();
    const { categories, isLoaded: categoriesLoaded } = useCategories();
    const [mounted, setMounted] = useState(false);

    // Filter state
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (status === "unauthenticated") {
        redirect("/");
    }

    if (status === "loading" || !isLoaded || !membersLoaded) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>;
    }

    // Apply filters
    const filteredTasks = tasks.filter(task => {
        const categoryMatch = categoryFilter === "all" || task.category === categoryFilter;
        const statusMatch = statusFilter === "all"
            || (statusFilter === "done" && task.isDone)
            || (statusFilter === "pending" && !task.isDone);
        return categoryMatch && statusMatch;
    });

    // Group by memberId (Email)
    const groupedTasks: Record<string, typeof tasks> = {};
    filteredTasks.forEach(task => {
        if (!groupedTasks[task.memberId]) groupedTasks[task.memberId] = [];
        groupedTasks[task.memberId].push(task);
    });

    // Get category name
    const getCategoryName = (categoryId: string) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name ?? categoryId;
    };

    const handleMemberClick = (email: string) => {
        router.push(`/member/${encodeURIComponent(email)}`);
    };

    return (
        <div className="min-h-screen bg-zinc-950 pb-32">
            <Header />

            <main className="mt-24 p-4 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                        Team Overview
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        チーム全体のタスク状況
                    </p>
                </div>

                {/* Two Column Layout: Left = Overview, Right = Members */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Overview & Charts */}
                    <div className="lg:col-span-1 space-y-6">
                        <WeekSummary currentWeekTasks={tasks} />
                        <WorkloadChart tasks={tasks} />
                        <WeekTrendChart />
                    </div>

                    {/* Right Column - Members */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 uppercase tracking-wider">カテゴリ:</span>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="all">すべて</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 uppercase tracking-wider">ステータス:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="all">すべて</option>
                                    <option value="pending">未完了</option>
                                    <option value="done">完了</option>
                                </select>
                            </div>
                            <div className="text-xs text-zinc-600 ml-auto">
                                {filteredTasks.length} タスク表示中
                            </div>
                        </div>

                        <h2 className="text-lg font-semibold text-zinc-200">メンバー別タスク</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(groupedTasks).map(([email, memberTasks]) => {
                                const member = members.find(m => m.email === email);
                                const avatarUrl = member?.avatarUrl;
                                const memberName = getMemberName(email);
                                const memberMaxPoints = member?.maxPoints ?? 15;
                                const currentPoints = memberTasks.filter(t => !t.isDone).reduce((sum, t) => sum + t.weight, 0);
                                const isOverLimit = currentPoints > memberMaxPoints;

                                return (
                                    <Card
                                        key={email}
                                        className={cn(
                                            "bg-zinc-900/30 border-zinc-800 cursor-pointer transition-all hover:bg-zinc-900/60 hover:border-zinc-600",
                                            isOverLimit && "border-red-800/50"
                                        )}
                                        onClick={() => handleMemberClick(email)}
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-3">
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={memberName}
                                                        className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-medium">
                                                        {memberName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <CardTitle className="text-base text-zinc-300 font-medium truncate">
                                                        {memberName}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-xs font-medium",
                                                            isOverLimit ? "text-red-400" : "text-zinc-500"
                                                        )}>
                                                            {currentPoints} / {memberMaxPoints} pt
                                                        </span>
                                                        {isOverLimit && <span className="text-xs text-red-400">⚠️</span>}
                                                    </div>
                                                </div>
                                                <span className="text-zinc-600 text-xs">→</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-1.5">
                                                {memberTasks.slice(0, 3).map(task => (
                                                    <div key={task.id} className={cn(
                                                        "flex items-center justify-between p-2 rounded border border-zinc-800/50 bg-zinc-900/50 text-sm",
                                                        task.isDone && "opacity-50"
                                                    )}>
                                                        <span className={cn("truncate flex-1", task.isDone && "line-through text-zinc-500")}>
                                                            {task.content}
                                                        </span>
                                                        <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-xs ml-2">
                                                            {task.weight}pt
                                                        </Badge>
                                                    </div>
                                                ))}
                                                {memberTasks.length > 3 && (
                                                    <div className="text-xs text-zinc-500 text-center pt-1">
                                                        + {memberTasks.length - 3} more tasks
                                                    </div>
                                                )}
                                                {memberTasks.length === 0 && (
                                                    <div className="text-zinc-600 text-sm italic">タスクなし</div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {Object.keys(groupedTasks).length === 0 && (
                                <div className="col-span-full text-center py-12 text-zinc-600">
                                    条件に合うタスクはありません
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
