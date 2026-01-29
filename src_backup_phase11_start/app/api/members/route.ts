import { NextResponse } from "next/server";
import { getMembers } from "@/lib/google-sheets";

export async function GET() {
    try {
        const members = await getMembers();
        return NextResponse.json(members);
    } catch (error: any) {
        console.error("API Members GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
