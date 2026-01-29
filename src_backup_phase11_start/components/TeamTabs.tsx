"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MEMBERS, TeamMemberId, Task } from "@/lib/types";
import { MemberDashboard } from "@/components/MemberDashboard";

interface TeamTabsProps {
    tasks: Task[];
    onAddTask: (memberId: TeamMemberId, content: string, weight: number) => void;
    onToggleTask: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
}

export function TeamTabs({
    tasks,
    onAddTask,
    onToggleTask,
    onDeleteTask
}: TeamTabsProps) {
    return (
        <Tabs defaultValue={MEMBERS[0].id} className="w-full">
            <TabsList className="w-full h-12 bg-zinc-900 border border-zinc-800 p-1">
                {MEMBERS.map((member) => (
                    <TabsTrigger
                        key={member.id}
                        value={member.id}
                        className="flex-1 h-full text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white font-medium"
                    >
                        {member.name}
                    </TabsTrigger>
                ))}
            </TabsList>

            {MEMBERS.map((member) => (
                <TabsContent key={member.id} value={member.id} className="mt-6">
                    <MemberDashboard
                        memberId={member.id}
                        tasks={tasks.filter((t) => t.memberId === member.id)}
                        onAddTask={onAddTask}
                        onToggleTask={onToggleTask}
                        onDeleteTask={onDeleteTask}
                    />
                </TabsContent>
            ))}
        </Tabs>
    );
}
