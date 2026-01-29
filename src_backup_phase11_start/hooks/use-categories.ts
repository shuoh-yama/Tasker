"use client";

import { useState, useEffect } from "react";
import { Category } from "@/lib/google-sheets";

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                setCategories(data);
            } catch (e) {
                console.error("Failed to fetch categories", e);
            } finally {
                setIsLoaded(true);
            }
        }
        fetchCategories();
    }, []);

    const getDefaultPoints = (categoryId: string): number => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.defaultPoints ?? 1;
    };

    return { categories, isLoaded, getDefaultPoints };
}
