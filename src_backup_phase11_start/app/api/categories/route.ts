import { NextResponse } from "next/server";
import { getCategories } from "@/lib/google-sheets";

export async function GET() {
    try {
        const categories = await getCategories();
        return NextResponse.json(categories);
    } catch (error: any) {
        console.error("API Categories GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
