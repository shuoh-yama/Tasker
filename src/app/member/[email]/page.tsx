"use client";

import { useSession } from "next-auth/react";
import { useTasks } from "@/hooks/use-tasks";
import { useMembers } from "@/hooks/use-members";
import { useCategories } from "@/hooks/use-categories";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirect, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Circle } from "lucide-react";

export default function MemberPage() {
    const params = useParams();
    const router = useRouter();
    const email = decodeURIComponent(params.email as string);

    const { data: session, status } = useSession();
    const { tasks, toggleTask, isLoaded } = useTasks();
    const { getMemberName, members, isLoaded: membersLoaded } = useMembers();
    const { categories, isLoaded: categoriesLoaded } = useCategories();
    const [mounted, setMounted] = useState(false);

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

    // Get member info
    const member = members.find(m => m.email === email);
    const memberName = getMemberName(email);
    const memberMaxPoints = member?.maxPoints ?? 15;
    const avatarUrl = member?.avatarUrl;

    // Get member's tasks
    const memberTasks = tasks.filter(t => t.memberId === email);
    const pendingTasks = memberTasks.filter(t => !t.isDone);
    const completedTasks = memberTasks.filter(t => t.isDone);
    const currentPoints = pendingTasks.reduce((sum, t) => sum + t.weight, 0);
    const isOverLimit = currentPoints > memberMaxPoints;

    // Get category name
    const getCategoryName = (categoryId: string) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name ?? categoryId;
    };

    return (
        <div className="min-h-screen bg-zinc-950 pb-32">
            <Header />

            <main className="mt-24 p-4 md:p-8 max-w-3xl mx-auto space-y-8">
                {/* Back button */}
                <Button
                    variant="ghost"
                    onClick={() => router.push("/team")}
                    className="text-zinc-400 hover:text-white -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    チームに戻る
                </Button>

                {/* Member Header */}
                <div className="flex items-center gap-4">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={memberName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-2xl font-medium">
                            {memberName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            {memberName}
                        </h1>
                        <p className="text-zinc-500 text-sm">{email}</p>
                        <div className={cn(
                            "text-sm mt-1",
                            isOverLimit ? "text-red-400" : "text-zinc-400"
                        )}>
                            {currentPoints} / {memberMaxPoints} pt
                            {isOverLimit && <span className="ml-2">⚠️ 上限超過</span>}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardContent className="pt-4">
                            <div className="text-xs text-zinc-500">合計タスク</div>
                            <div className="text-2xl font-bold text-white">{memberTasks.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardContent className="pt-4">
                            <div className="text-xs text-zinc-500">未完了</div>
                            <div className="text-2xl font-bold text-yellow-400">{pendingTasks.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardContent className="pt-4">
                            <div className="text-xs text-zinc-500">完了</div>
                            <div className="text-2xl font-bold text-green-400">{completedTasks.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Tasks */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-200">未完了タスク</h2>
                    {pendingTasks.length === 0 ? (
                        <div className="text-zinc-600 italic p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                            未完了のタスクはありません
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingTasks.map(task => (
                                <Card key={task.id} className="bg-zinc-900/30 border-zinc-800">
                                    <CardContent className="py-4">
                                        <div className="flex items-start gap-4">
                                            <button
                                                onClick={() => toggleTask(task.id)}
                                                className="text-zinc-500 hover:text-green-400 transition-colors mt-1"
                                            >
                                                <Circle className="w-5 h-5" />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-base font-medium text-zinc-200">
                                                    {task.content}
                                                </div>
                                                <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                                                    <span className="text-blue-400 font-semibold">{getCategoryName(task.category)}</span>
                                                    <span>•</span>
                                                    <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                                                        {task.weight}pt
                                                    </Badge>
                                                </div>
                                                {/* Notes Section */}
                                                {task.notes && (
                                                    <div className="mt-3 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                                        <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                                                            📝 メモ
                                                        </div>
                                                        <div className="text-sm text-zinc-300">
                                                            {task.notes}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Tasks */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-200">完了タスク</h2>
                    {completedTasks.length === 0 ? (
                        <div className="text-zinc-600 italic p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                            完了したタスクはありません
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {completedTasks.map(task => (
                                <div
                                    key={task.id}
                                    className="p-3 bg-zinc-900/20 rounded-lg border border-zinc-800/50 flex items-center gap-3 opacity-60"
                                >
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        className="text-green-500 hover:text-green-400 transition-colors"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-zinc-500 line-through truncate">
                                            {task.content}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="border-zinc-800 text-zinc-600 text-xs">
                                        {task.weight}pt
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
