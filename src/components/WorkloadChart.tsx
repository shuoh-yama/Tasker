"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/lib/types";
import { useMembers } from "@/hooks/use-members";

interface WorkloadChartProps {
    tasks: Task[];
}

export function WorkloadChart({ tasks }: WorkloadChartProps) {
    const { getMemberName, members } = useMembers();

    // 1. Group tasks by memberId
    const workloadByMember = tasks
        // .filter(t => !t.isDone) // Count ALL tasks for capacity view
        .reduce((acc, task) => {
            acc[task.memberId] = (acc[task.memberId] || 0) + task.weight;
            return acc;
        }, {} as Record<string, number>);

    // 2. Convert to array for Recharts
    const data = Object.entries(workloadByMember).map(([memberId, points]) => {
        // Simple consistent color generation based on memberId string
        const hash = memberId.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const hue = Math.abs(hash % 360);
        const color = `hsl(${hue}, 70%, 50%)`;

        return {
            name: getMemberName(memberId), // Use member name from Members sheet
            points,
            color,
        };
    });

    return (
        <Card className="border-border bg-card">
            <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-lg font-medium tracking-tight">
                    Current Workload
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}pt`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                                cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                            />
                            <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="3 3" />
                            <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.points > 15 ? "#ef4444" : entry.points > 10 ? "#f97316" : entry.color}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
