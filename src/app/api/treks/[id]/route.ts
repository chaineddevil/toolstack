import { NextResponse } from "next/server";

// Treks API deprecated
export async function PATCH() {
  return NextResponse.json(
    { error: "Treks have been deprecated." },
    { status: 410 }
  );
}
