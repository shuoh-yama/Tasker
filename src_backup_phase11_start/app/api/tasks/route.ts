import { NextResponse } from "next/server";
import { getTasks, addTask, deleteTask, updateTaskStatus, updateTask } from "@/lib/google-sheets";
import { Task } from "@/lib/types";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    // If email is present, filter by it. If string "null", fetch all.
    const tasks = await getTasks(email || undefined);
    return NextResponse.json(tasks);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { memberId, content, weight, category, workWeek, notes } = body;

        const newTask: Task = {
            id: crypto.randomUUID(),
            memberId,
            content,
            weight,
            category: category || 'other',
            workWeek: workWeek || new Date().toISOString().split('T')[0],
            notes: notes || "",
            isDone: false,
            createdAt: Date.now(),
        };

        await addTask(newTask);
        return NextResponse.json(newTask);
    } catch (error: any) {
        console.error("API POST Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error", details: error },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
        await deleteTask(id);
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
}

export async function PATCH(request: Request) {
    const body = await request.json();
    const { id, isDone, content, weight, category, notes } = body;

    if (!id) {
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // If isDone is being toggled
    if (typeof isDone === "boolean") {
        await updateTaskStatus(id, isDone);
        return NextResponse.json({ success: true });
    }

    // If editing task (content, weight, category, notes)
    if (content !== undefined || weight !== undefined || category !== undefined || notes !== undefined) {
        await updateTask(id, { content, weight, category, notes });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
}
