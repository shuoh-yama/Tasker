"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useMembers } from "@/hooks/use-members";
import { useCategories } from "@/hooks/use-categories";
import { Header } from "@/components/Header";
import { MonthPicker } from "@/components/MonthPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, CheckCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { tasks, isLoaded: tasksLoaded } = useTasks();
    const { members, isLoaded: membersLoaded } = useMembers();
    const { categories, isLoaded: categoriesLoaded, getCategoryName } = useCategories();

    if (!tasksLoaded || !membersLoaded || !categoriesLoaded) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    // Filter tasks by selected month
    const filteredTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.getMonth() === currentDate.getMonth() &&
            taskDate.getFullYear() === currentDate.getFullYear();
    });

    const completedTasks = filteredTasks.filter(t => t.isDone);
    const totalPoints = completedTasks.reduce((sum, t) => sum + t.weight, 0);

    // Calculate Member Stats
    const memberStats = members.map(member => {
        // Count tasks assigned to or owned by member
        const myTasks = completedTasks.filter(t => (t.assignedTo || t.memberId) === member.id);
        const points = myTasks.reduce((sum, t) => sum + t.weight, 0);
        const count = myTasks.length;

        // Find top category for this member
        const catCounts: Record<string, number> = {};
        myTasks.forEach(t => {
            const catPoints = t.weight;
            catCounts[t.category] = (catCounts[t.category] || 0) + catPoints; // Based on points
        });

        let topCategoryName = "-";
        let maxPoints = -1;

        Object.entries(catCounts).forEach(([catId, pts]) => {
            if (pts > maxPoints) {
                maxPoints = pts;
                topCategoryName = getCategoryName(catId);
            }
        });

        return {
            ...member,
            points,
            count,
            topCategoryName
        };
    }).sort((a, b) => b.points - a.points);

    // Category Distribution
    const categoryStats = categories.map(cat => {
        const catTasks = completedTasks.filter(t => t.category === cat.id);
        return {
            name: cat.name,
            count: catTasks.length,
            points: catTasks.reduce((sum, t) => sum + t.weight, 0)
        };
    }).sort((a, b) => b.points - a.points);

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto max-w-5xl p-4 pt-24 space-y-8 pb-20">
                <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">月次レポート</h1>
                        <p className="text-muted-foreground text-sm">チームの活動状況を月単位で振り返ります</p>
                    </div>
                    <MonthPicker currentDate={currentDate} onMonthChange={setCurrentDate} />
                </header>

                {/* Total Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-card border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">月間獲得ポイント</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-foreground flex items-baseline gap-2">
                                {totalPoints}
                                <span className="text-sm font-normal text-muted-foreground">pt</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">完了タスク数</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-foreground flex items-baseline gap-2">
                                {completedTasks.length}
                                <span className="text-sm font-normal text-muted-foreground">tasks</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Member Stats Grid */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        メンバー別実績
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {memberStats.map((member) => (
                            <Card key={member.id} className="bg-card border-border hover:bg-muted/50 transition-colors">
                                <CardContent className="p-4 flex items-center gap-4">
                                    {/* Avatar */}
                                    {member.avatarUrl ? (
                                        <img
                                            src={member.avatarUrl}
                                            alt={member.name}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-border"
                                        />
                                    ) : (
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-primary-foreground shadow-lg",
                                            member.color || "bg-primary"
                                        )}>
                                            {member.name[0]}
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <div className="font-bold text-foreground">{member.name}</div>
                                        <div className="flex items-center gap-3 mt-1 text-sm">
                                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                                                {member.points} pt
                                            </Badge>
                                            <span className="text-muted-foreground">{member.count} tasks</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            Main: <span className="text-foreground">{member.topCategoryName}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Category Stats */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        カテゴリ別内訳
                    </h2>
                    <div className="space-y-3">
                        {categoryStats.map((cat) => (
                            <div key={cat.name} className="flex items-center gap-4">
                                <div className="w-24 text-sm text-muted-foreground truncate text-right">{cat.name}</div>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                        style={{ width: `${totalPoints > 0 ? (cat.points / totalPoints) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="w-16 text-sm text-right font-mono text-foreground">
                                    {cat.points} pt
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
