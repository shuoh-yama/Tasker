"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface WeekContextType {
    currentWeek: Date; // The Monday of the selected week
    nextWeek: () => void;
    prevWeek: () => void;
    setWeek: (date: Date) => void;
    weekString: string; // ISO string YYYY-MM-DD for storage
}

const WeekContext = createContext<WeekContextType | undefined>(undefined);

export function WeekProvider({ children }: { children: ReactNode }) {
    // Initialize with the current week's Monday
    const [currentWeek, setCurrentWeek] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const nextWeek = () => {
        setCurrentWeek((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() + 7);
            return next;
        });
    };

    const prevWeek = () => {
        setCurrentWeek((prev) => {
            const prevDate = new Date(prev);
            prevDate.setDate(prevDate.getDate() - 7);
            return prevDate;
        });
    };

    const setWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        setCurrentWeek(d);
    };

    // Format for storage/matching (YYYY-MM-DD of Monday)
    const weekString = currentWeek.toISOString().split('T')[0];

    return (
        <WeekContext.Provider value={{ currentWeek, nextWeek, prevWeek, setWeek, weekString }}>
            {children}
        </WeekContext.Provider>
    );
}

export function useWeek() {
    const context = useContext(WeekContext);
    if (context === undefined) {
        throw new Error("useWeek must be used within a WeekProvider");
    }
    return context;
}
