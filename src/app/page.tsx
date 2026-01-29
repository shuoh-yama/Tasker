"use client";

import { useSession, signIn } from "next-auth/react";
import { useTasks } from "@/hooks/use-tasks";
import { useMembers } from "@/hooks/use-members";
import { MemberDashboard } from "@/components/MemberDashboard";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { RegistrationModal } from "@/components/Onboarding/RegistrationModal";
import { TutorialManager } from "@/components/Onboarding/TutorialManager";

export default function MyPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const { members, isLoaded: isMembersLoaded } = useMembers();

  const { tasks, addTask, toggleTask, deleteTask, editTask, copyTaskToNextWeek, clearDone, isLoaded } = useTasks();

  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-login: Automatically trigger sign-in when unauthenticated
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      signIn("google");
    }
  }, [mounted, status]);

  // Check registration status (only when authenticated and members loaded)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email && isMembersLoaded) {
      console.log("Checking registration for:", session.user.email);
      console.log("Members loaded, count:", members.length);

      const isRegistered = members.some(m => m.email === session.user?.email);
      console.log("isRegistered:", isRegistered);

      // If NOT registered, show modal.
      if (!isRegistered) {
        console.log("Showing registration modal");
        setShowRegistration(true);
      }
    }
  }, [status, session, members, isMembersLoaded]);

  const handleRegisterSuccess = () => {
    setShowRegistration(false);
    // Reload to refresh members list and let Tutorial check run
    window.location.reload();
  };


  if (!mounted) return null;

  // Show loading while auto-redirecting to Google login
  if (status === "unauthenticated" || status === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground tracking-tighter">
            Tasker
          </h1>
          <div className="text-muted-foreground">ログイン中...</div>
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // Allow partial loading (members might load after tasks)
  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const myEmail = session?.user?.email || "";
  const myTasks = tasks.filter(t => t.memberId === myEmail);
  const myMember = members.find(m => m.email === myEmail);
  const myMaxPoints = myMember?.maxPoints ?? 15;

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <RegistrationModal
        isOpen={showRegistration}
        onRegisterSuccess={handleRegisterSuccess}
      />

      {/* Tutorial Manager: Only active if NOT showing registration */}
      {!showRegistration && (
        <TutorialManager
          startTutorial={true}
          onComplete={() => { }}
        />
      )}

      <main className="mt-24 p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
              My Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Your tasks and workload
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-muted"
            onClick={clearDone}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Clear Done
          </Button>
        </div>

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
