import { NextResponse } from "next/server";

// Reels API deprecated — kept for backward compat
export async function POST() {
  return NextResponse.json(
    { error: "Reels have been deprecated. Use /api/posts instead." },
    { status: 410 }
  );
}
