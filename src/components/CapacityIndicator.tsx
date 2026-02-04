"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, TeamMember } from "@/lib/types";
import { useWeek } from "@/context/WeekContext";
import { cn } from "@/lib/utils";


interface CapacityIndicatorProps {
    members: TeamMember[];
    tasks: Task[];
}

export function CapacityIndicator({ members, tasks }: CapacityIndicatorProps) {
    const { currentWeek } = useWeek();

    // Helper to get week string (YYYY-MM-DD of start date)
    const getWeekStr = (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay() + 1); // Monday
        return d.toISOString().split('T')[0];
    };

    const currentWeekStart = new Date(currentWeek);
    const nextWeekStart = new Date(currentWeek);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const currentWeekStr = getWeekStr(currentWeekStart);
    const nextWeekStr = getWeekStr(nextWeekStart);

    const data = members.map(member => {
        const memberTasks = tasks.filter(t => (t.assignedTo || t.memberId) === member.id);

        const currentLoad = memberTasks
            .filter(t => t.workWeek === currentWeekStr) // Count active load? Or all load? Plan said "Load". Usually "Remaining Load" or "Total Planned". Let's stick to Total Planned for Capacity planning.
            .reduce((sum, t) => sum + t.weight, 0);

        const nextLoad = memberTasks
            .filter(t => t.workWeek === nextWeekStr)
            .reduce((sum, t) => sum + t.weight, 0);

        const capacity = member.maxPoints || 15; // Default if not set
        const usageRate = (currentLoad / capacity) * 100;

        let statusColor = "bg-green-500";
        if (usageRate > 100) statusColor = "bg-red-500";
        else if (usageRate > 80) statusColor = "bg-yellow-500";

        return {
            name: member.name,
            currentLoad,
            nextLoad,
            capacity,
            statusColor
        };
    });

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                    <span>チームキャパシティ予測</span>
                    <div className="flex items-center gap-4 text-xs font-normal">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                            <span>今週の負荷</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-900/50 border border-blue-800 rounded-sm"></div>
                            <span>来週の予測</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-1 bg-red-500"></div>
                            <span>キャパシティライン</span>
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* HTML/CSS implementation */}
                <div className="space-y-6">
                    {data.map((member) => (
                        <div key={member.name} className="relative">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-bold text-foreground">{member.name}</span>
                                <span className="text-muted-foreground">
                                    {member.currentLoad} / <span className="text-foreground">{member.capacity}</span> pt
                                </span>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="h-4 bg-muted/50 rounded-full relative overflow-hidden">
                                {/* Current Load Bar */}
                                <div
                                    className={cn("h-full transition-all duration-500",
                                        member.currentLoad > member.capacity ? "bg-red-500" :
                                            member.currentLoad > member.capacity * 0.8 ? "bg-yellow-500" : "bg-blue-500"
                                    )}
                                    style={{ width: `${Math.min((member.currentLoad / member.capacity) * 100, 100)}%` }}
                                />
                            </div>

                            {/* Next Week Prediction (Small bar below) */}
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>来週予測: {member.nextLoad} pt</span>
                                <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-900"
                                        style={{ width: `${Math.min((member.nextLoad / member.capacity) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
