"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWeek } from "@/context/WeekContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { currentWeek, nextWeek, prevWeek } = useWeek();

    // Format week range in Japanese: "1月27日 〜 2月2日"
    const formatDate = (date: Date) => {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    };
    const start = currentWeek;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const dateRange = `${formatDate(start)} 〜 ${formatDate(end)}`;

    return (
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md z-50">
            <div className="h-full max-w-7xl mx-auto px-4 flex items-center">
                {/* Left: Logo */}
                <div className="flex-shrink-0 text-xl font-bold tracking-tighter text-white">
                    Team<span className="text-blue-500">Workload</span>
                </div>

                {/* Center: Week Picker + Nav */}
                {session && (
                    <div className="flex-1 flex items-center justify-center gap-6">
                        {/* Navigation */}
                        <nav className="flex gap-4">
                            <Link
                                href="/"
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-white",
                                    pathname === "/" ? "text-white" : "text-zinc-500"
                                )}
                            >
                                My Tasks
                            </Link>
                            <Link
                                href="/team"
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-white",
                                    pathname === "/team" ? "text-white" : "text-zinc-500"
                                )}
                            >
                                Team Status
                            </Link>
                        </nav>

                        {/* Week Picker */}
                        <div className="flex items-center gap-2 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800">
                            <button
                                onClick={prevWeek}
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-zinc-200 min-w-[130px] text-center">
                                {dateRange}
                            </span>
                            <button
                                onClick={nextWeek}
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Right: User Info */}
                <div className="flex-shrink-0 flex items-center gap-4">
                    {session ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-zinc-400 hidden sm:inline-block">
                                {session.user?.name}
                            </span>
                            <Button
                                onClick={() => signOut()}
                                variant="outline"
                                size="sm"
                                className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400"
                            >
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={() => signIn("google")} size="sm" className="bg-white text-black hover:bg-zinc-200">
                            Sign In with Google
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
