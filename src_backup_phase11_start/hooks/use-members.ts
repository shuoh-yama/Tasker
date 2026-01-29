"use client";

import { useState, useEffect } from "react";
import { TeamMember } from "@/lib/types";

export function useMembers() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function fetchMembers() {
            try {
                const res = await fetch("/api/members");
                const data = await res.json();
                setMembers(data);
            } catch (e) {
                console.error("Failed to fetch members", e);
            } finally {
                setIsLoaded(true);
            }
        }
        fetchMembers();
    }, []);

    const getMemberName = (email: string): string => {
        const member = members.find(m => m.email === email);
        return member?.name ?? email; // Fallback to email if not found
    };

    return { members, isLoaded, getMemberName };
}
