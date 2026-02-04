"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWeek } from "@/context/WeekContext";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { SettingsModal } from "@/components/SettingsModal";
export function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { currentWeek, nextWeek, prevWeek } = useWeek();
    const [showSettings, setShowSettings] = useState(false);

    // Format week range in Japanese: "1月27日 〜 2月2日"
    const formatDate = (date: Date) => {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    };
    const start = currentWeek;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const dateRange = `${formatDate(start)} 〜 ${formatDate(end)}`;

    return (
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-50">
            <div className="h-full max-w-7xl mx-auto px-4 flex items-center">
                {/* Left: Logo */}
                <div className="flex-shrink-0 text-xl font-bold tracking-tighter text-foreground">
                    Tasker
                </div>

                {/* Center: Week Picker + Nav */}
                {session && (
                    <div className="flex-1 flex items-center justify-center gap-6">
                        {/* Navigation */}
                        <nav className="flex gap-4">
                            <Link
                                href="/"
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-foreground",
                                    pathname === "/" ? "text-foreground" : "text-muted-foreground"
                                )}
                            >
                                My Tasks
                            </Link>
                            <Link
                                href="/team"
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-foreground",
                                    pathname === "/team" ? "text-foreground" : "text-muted-foreground"
                                )}
                            >
                                Team Status
                            </Link>
                            <Link
                                href="/report"
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-foreground",
                                    pathname === "/report" ? "text-foreground" : "text-muted-foreground"
                                )}
                            >
                                Report
                            </Link>
                        </nav>

                        {/* Week Picker */}
                        <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg border border-border">
                            <button
                                onClick={prevWeek}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-foreground min-w-[130px] text-center">
                                {dateRange}
                            </span>
                            <button
                                onClick={nextWeek}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Right: User Info */}
                <div className="flex-shrink-0 flex items-center gap-4">
                    <ModeToggle />
                    {session ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground hidden sm:inline-block">
                                {session.user?.name}
                            </span>
                            <Button
                                onClick={() => setShowSettings(true)}
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Settings className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={() => signOut()}
                                variant="outline"
                                size="sm"
                                className="border-border bg-transparent hover:bg-muted text-muted-foreground"
                            >
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={() => signIn("google")} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Sign In with Google
                        </Button>
                    )}
                </div>
            </div>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </header>
    );
}
