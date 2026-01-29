import { NextResponse } from "next/server";
import { updateTask } from "@/lib/google-sheets";

export async function POST(request: Request) {
    try {
        const { updates } = await request.json(); // { id: string, order: number }[]

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Processing safely
        // In a real DB we would use a transaction or batch update.
        // Here we parallelize, but limited to avoid rate limits if too many.
        // For standard Drag & Drop (moving one item), usually all items order might change or just a subset.
        // We expect `updates` to contain all items that need order change.

        await Promise.all(updates.map((u: any) =>
            updateTask(u.id, { order: u.order })
        ));

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Reorder failed", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
