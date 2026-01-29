"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthPickerProps {
    currentDate: Date;
    onMonthChange: (date: Date) => void;
}

export function MonthPicker({ currentDate, onMonthChange }: MonthPickerProps) {
    const handlePrevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        onMonthChange(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        onMonthChange(newDate);
    };

    // Format: YYYY年MM月
    const formatMonth = (date: Date) => {
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    };

    return (
        <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-lg border border-border">
            <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
                <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="text-lg font-bold text-foreground min-w-[120px] text-center">
                {formatMonth(currentDate)}
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
                <ChevronRight className="w-5 h-5" />
            </Button>
        </div>
    );
}
