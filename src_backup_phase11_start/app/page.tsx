"use client";

import { useSession, signIn } from "next-auth/react";
import { useTasks } from "@/hooks/use-tasks";
import { useMembers } from "@/hooks/use-members";
import { WorkloadChart } from "@/components/WorkloadChart";
import { MemberDashboard } from "@/components/MemberDashboard";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Trash2, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { MEMBERS } from "@/lib/types"; // Keep for colors if needed, or dynamic? using static for now

export default function MyPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const { members } = useMembers();

  // For My Page, we filter tasks by my email to show in the list
  // BUT for the Chart, we usually want to see where we stand vs others?
  // The user said "My Page has my task status", "Other page has others".
  // Let's load "My Tasks" for the list.
  // For the chart, maybe just load global stats? 
  // Let's load ALL tasks for the chart context, but filter list for editing.
  // Actually, useTasks fetches what we ask. If we want chart + personal list, we might need two fetches or client filter.
  // Optimization: Fetch ALL tasks, then client-side filter for the list.
  // Optimize: fetching logic is inside useTasks
  const { tasks, addTask, toggleTask, deleteTask, editTask, copyTaskToNextWeek, clearDone, isLoaded } = useTasks();

  // Fix: addTask sig changed. Page doesn't call it directly, MemberDashboard does.
  // Wait, MemberDashboard expects (id, content, weight, category) => void.
  // useTasks returns addTask(id, content, weight, category).
  // The error was: Argument of type '(memberId: string, content: string, weight: number, category: string) => Promise<void>' is not assignable... 3 arguments.
  // Ah, MemberDashboard usage in page.tsx likely only passes 3?
  // I need to check MemberDashboard usage in page.tsx.

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-login: Automatically trigger sign-in when unauthenticated
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      signIn("google");
    }
  }, [mounted, status]);

  if (!mounted) return null;

  // Show loading while auto-redirecting to Google login
  if (status === "unauthenticated" || status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white tracking-tighter">
            Team<span className="text-blue-500">Workload</span>
          </h1>
          <div className="text-zinc-500">ログイン中...</div>
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>;
  }

  const myEmail = session?.user?.email || "";
  const myTasks = tasks.filter(t => t.memberId === myEmail);
  const myMember = members.find(m => m.email === myEmail);
  const myMaxPoints = myMember?.maxPoints ?? 15;

  return (
    <div className="min-h-screen bg-zinc-950 pb-32">
      <Header />

      <main className="mt-24 p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              My Dashboard
            </h1>
            <p className="text-zinc-500 text-sm">
              Your tasks and workload
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-600 hover:text-red-500 hover:bg-zinc-900/50"
            onClick={clearDone}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Clear Done
          </Button>
        </div>

        {/* Chart Section - Showing ALL tasks for context? Or just me? 
            "My page includes my task status". Usually nice to see everything.
            Let's show the Global Chart but highlight ME? 
            For V1, standard chart with everyone.
        */}
        {/* Chart Section - Removed as per Phase 6 */}
        {/* <WorkloadChart tasks={tasks} /> */}

        {/* Input Section - Hardcoded memberId to myEmail */}
        <MemberDashboard
          memberId={myEmail}
          memberMaxPoints={myMaxPoints}
          tasks={myTasks}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onEditTask={editTask}
          onCopyToNextWeek={copyTaskToNextWeek}
        />
      </main>
    </div>
  );
}
