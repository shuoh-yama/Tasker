"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/lib/types";
import { useWeek } from "@/context/WeekContext";

interface WeekTrendChartProps {
    // We'll fetch all tasks to build weekly trend
}

export function WeekTrendChart() {
    const { weekString, currentWeek } = useWeek();
    const [weeklyData, setWeeklyData] = useState<{ week: string; total: number; completed: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Get past 4 weeks + current week
    const getWeekStrings = () => {
        const weeks: string[] = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date(currentWeek);
            d.setDate(d.getDate() - (7 * i));
            weeks.push(d.toISOString().split("T")[0]);
        }
        return weeks;
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/tasks");
                const allTasks: Task[] = await res.json();
                const weeks = getWeekStrings();

                const data = weeks.map(week => {
                    const weekTasks = allTasks.filter(t => t.workWeek === week);
                    const total = weekTasks.reduce((sum, t) => sum + t.weight, 0);
                    const completed = weekTasks.filter(t => t.isDone).reduce((sum, t) => sum + t.weight, 0);

                    // Format week for display (MM/DD)
                    const weekDate = new Date(week);
                    const label = `${weekDate.getMonth() + 1}/${weekDate.getDate()}`;

                    return { week: label, total, completed };
                });

                setWeeklyData(data);
            } catch (e) {
                console.error("Failed to fetch weekly data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [weekString]);

    if (isLoading) {
        return (
            <Card className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="h-[200px] flex items-center justify-center text-zinc-500">
                    Loading...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-zinc-100 text-lg font-medium tracking-tight">
                    週別推移 (過去5週間)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis
                                dataKey="week"
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                tickFormatter={(value) => `${value}pt`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#f4f4f5" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: "#3b82f6", r: 4 }}
                                name="合計"
                            />
                            <Line
                                type="monotone"
                                dataKey="completed"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={{ fill: "#22c55e", r: 4 }}
                                name="完了"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
