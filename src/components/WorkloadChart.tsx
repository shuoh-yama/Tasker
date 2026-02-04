"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/lib/types";
import { useMembers } from "@/hooks/use-members";
import { useCategories } from "@/hooks/use-categories";

interface WorkloadChartProps {
    tasks: Task[];
}

// Colors for categories (Synced with CategoryPieChart)
const COLORS = [
    "#3b82f6", // blue
    "#a855f7", // purple
    "#22c55e", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#06b6d4", // cyan
];

export function WorkloadChart({ tasks }: WorkloadChartProps) {
    const { getMemberName } = useMembers();
    const { categories } = useCategories();

    // 1. Group tasks by memberId and category through reduction
    // Structure: { [memberId]: { name: string, [categoryId]: number, total: number } }
    const workloadByMember = tasks.reduce((acc, task) => {
        const memberId = task.memberId;
        if (!acc[memberId]) {
            acc[memberId] = { name: getMemberName(memberId), total: 0 };
        }

        const points = task.weight;
        const categoryId = task.category;

        // Add points to specific category
        acc[memberId][categoryId] = (acc[memberId][categoryId] || 0) + points;

        // Add to total (for potential sorting or other uses, though stacked bar handles display)
        acc[memberId].total += points;

        return acc;
    }, {} as Record<string, any>);

    // 2. Convert to array for Recharts
    const data = Object.values(workloadByMember);

    if (data.length === 0) return null;

    return (
        <Card className="border-border bg-card">
            <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-lg font-medium tracking-tight">
                    Current Workload (by Category)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
                                formatter={(value: any, name: any) => {
                                    // Try to find category name
                                    const cat = categories.find(c => c.id === name);
                                    return [`${value}pt`, cat ? cat.name : name];
                                }}
                            />
                            <Legend
                                formatter={(value) => {
                                    const cat = categories.find(c => c.id === value);
                                    return <span className="text-foreground text-xs">{cat ? cat.name : value}</span>;
                                }}
                            />

                            {/* Dynamically create Bar for each category */}
                            {categories.map((category, index) => (
                                <Bar
                                    key={category.id}
                                    dataKey={category.id}
                                    stackId="a"
                                    fill={COLORS[index % COLORS.length]}
                                    radius={[0, 0, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
