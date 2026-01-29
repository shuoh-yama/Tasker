import { NextResponse } from "next/server";
import { getMembers, ensureMember } from "@/lib/google-sheets";

export async function GET() {
    try {
        const members = await getMembers();
        return NextResponse.json(members);
    } catch (error) {
        console.error("Failed to fetch members:", error);
        return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, avatarUrl, maxPoints } = body;

        if (!email || !name) {
            return NextResponse.json({ error: "Email and Name are required" }, { status: 400 });
        }

        await ensureMember({
            email,
            name,
            image: avatarUrl || "",
            maxPoints: maxPoints ? Number(maxPoints) : undefined,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to register member:", error);
        return NextResponse.json({ error: "Failed to register member" }, { status: 500 });
    }
}
