import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const role = await getUserRole();
    // Only Managers and Super Admins can add ledger entries
    if (!role || !["super_admin", "manager"].includes(role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.account_id || !body.amount || !body.entry_type) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert entry
    const { data, error } = await supabase
        .from("ledger_entries")
        .insert(body)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function GET(request: NextRequest) {
    const role = await getUserRole();
    if (!role || !["super_admin", "manager"].includes(role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await createClient();
    const url = new URL(request.url);
    const accountId = url.searchParams.get("account_id");

    let query = supabase
        .from("ledger_entries")
        .select(`
            *,
            tools (name),
            ledger_accounts (name)
        `)
        .order("occurred_at", { ascending: false });

    if (accountId) {
        query = query.eq("account_id", accountId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
