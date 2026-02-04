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
import { CapacityIndicator } from "@/components/CapacityIndicator";
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
        return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
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
        <div className="min-h-screen bg-background pb-32">
            <Header />

            <main className="mt-24 p-4 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                        Team Overview
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        チーム全体のタスク状況
                    </p>
                </div>

                {/* Two Column Layout: Left = Overview, Right = Members */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Overview & Charts */}
                    <div className="lg:col-span-1 space-y-6">
                        <WeekSummary currentWeekTasks={tasks} />
                        <CapacityIndicator members={members} tasks={tasks} />
                        <WorkloadChart tasks={tasks} />
                        <WeekTrendChart />
                    </div>

                    {/* Right Column - Members */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-card border border-border">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">カテゴリ:</span>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="all">すべて</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">ステータス:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="all">すべて</option>
                                    <option value="pending">未完了</option>
                                    <option value="done">完了</option>
                                </select>
                            </div>
                            <div className="text-xs text-muted-foreground ml-auto">
                                {filteredTasks.length} タスク表示中
                            </div>
                        </div>

                        <h2 className="text-lg font-semibold text-foreground">メンバー別タスク</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {members.map((member) => {
                                const email = member.email;
                                if (!email) return null; // Email is required for task association

                                const memberTasks = groupedTasks[email] || []; // Get tasks or empty array
                                const avatarUrl = member.avatarUrl;
                                const memberName = member.name;
                                const memberMaxPoints = member.maxPoints ?? 15;
                                const currentPoints = memberTasks.reduce((sum: number, t: any) => sum + t.weight, 0);
                                const isOverLimit = currentPoints > memberMaxPoints;

                                return (
                                    <Card
                                        key={email}
                                        className={cn(
                                            "bg-card border-border cursor-pointer transition-all hover:bg-muted/50 hover:border-sidebar-foreground/20",
                                            isOverLimit && "border-destructive/50"
                                        )}
                                        onClick={() => handleMemberClick(email)}
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-3">
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={memberName}
                                                        className="w-10 h-10 rounded-full object-cover border border-border"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                                                        {memberName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <CardTitle className="text-base text-foreground font-medium truncate">
                                                        {memberName}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-xs font-medium",
                                                            isOverLimit ? "text-destructive" : "text-muted-foreground"
                                                        )}>
                                                            {currentPoints} / {memberMaxPoints} pt
                                                        </span>
                                                        {isOverLimit && <span className="text-xs text-destructive">⚠️</span>}
                                                    </div>
                                                </div>
                                                <span className="text-muted-foreground text-xs">→</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-1.5">
                                                {memberTasks.slice(0, 3).map((task: any) => (
                                                    <div key={task.id} className={cn(
                                                        "flex items-center justify-between p-2 rounded border border-border bg-muted/30 text-sm",
                                                        task.isDone && "opacity-50"
                                                    )}>
                                                        <span className={cn("truncate flex-1", task.isDone && "line-through text-muted-foreground")}>
                                                            {task.content}
                                                        </span>
                                                        <Badge variant="outline" className="border-border text-muted-foreground text-xs ml-2">
                                                            {task.weight}pt
                                                        </Badge>
                                                    </div>
                                                ))}
                                                {memberTasks.length > 3 && (
                                                    <div className="text-xs text-muted-foreground text-center pt-1">
                                                        + {memberTasks.length - 3} more tasks
                                                    </div>
                                                )}
                                                {memberTasks.length === 0 && (
                                                    <div className="text-muted-foreground text-sm italic">タスクなし</div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
