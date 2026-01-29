"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, CATEGORY_LABELS, TaskCategory } from "@/lib/types";
import { useCategories } from "@/hooks/use-categories";

interface CategoryPieChartProps {
    tasks: Task[];
}

// Colors for categories
const COLORS = [
    "#3b82f6", // blue
    "#a855f7", // purple
    "#22c55e", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#06b6d4", // cyan
];

export function CategoryPieChart({ tasks }: CategoryPieChartProps) {
    const { categories } = useCategories();

    // Group by category
    const categoryData = tasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + task.weight;
        return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(categoryData).map(([category, points], index) => {
        const categoryName = categories.find(c => c.id === category)?.name
            || CATEGORY_LABELS[category as TaskCategory]
            || category;
        return {
            name: categoryName,
            value: points,
            color: COLORS[index % COLORS.length],
        };
    });

    if (data.length === 0) {
        return null;
    }

    return (
        <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-zinc-100 text-lg font-medium tracking-tight">
                    カテゴリ別分布
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                labelLine={false}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#f4f4f5" }}
                                formatter={(value) => [`${value ?? 0}pt`, "ポイント"]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
