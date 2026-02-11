import { NextResponse } from "next/server";

// Treks API deprecated
export async function GET() {
  return NextResponse.json(
    { error: "Treks have been deprecated." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Treks have been deprecated. Use /api/posts instead." },
    { status: 410 }
  );
}
