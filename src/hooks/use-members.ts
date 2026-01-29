import { useState, useEffect } from 'react';
import { TeamMember } from '@/lib/types';

export function useMembers() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function fetchMembers() {
            try {
                const res = await fetch('/api/members');
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data);
                }
            } catch (e) {
                console.error("Failed to fetch members", e);
            } finally {
                setIsLoaded(true);
            }
        }

        fetchMembers();
    }, []);

    const getMemberName = (id: string) => {
        const member = members.find(m => m.id === id);
        return member ? member.name : id;
    };

    return { members, isLoaded, getMemberName };
}
