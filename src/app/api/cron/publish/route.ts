import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    // Check for cron secret if deployed, or admin role if manual trigger
    // For simplicity, checking query param or just allowing if environment is protected
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow fallback to session auth for manual testing
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // 1. Publish Tools
    const { data: toolsToPublish, error: toolsError } = await supabase
        .from("tools")
        .select("id, name")
        .eq("status", "scheduled")
        .lte("published_at", now); // If published_at was set in future and we passed it

    // Actually, 'scheduled' usually implies we need to check a separate scheduled_jobs table 
    // OR we check tools where status='scheduled' and we assume they should be published NOW or if they have a date field.
    // The implementations plan said: "If status = scheduled: Insert into scheduled_jobs".
    // So we should check scheduled_jobs table.

    const { data: jobs, error: jobsError } = await supabase
        .from("scheduled_jobs")
        .select("*")
        .eq("status", "pending")
        .lte("publish_at", now);

    if (jobsError) return NextResponse.json({ error: jobsError.message }, { status: 500 });

    const results = [];

    if (jobs && jobs.length > 0) {
        for (const job of jobs) {
            try {
                // Update entity status
                if (job.entity_type === "tool") {
                    await supabase.from("tools").update({ status: "published" }).eq("id", job.entity_id);
                } else if (job.entity_type === "post") {
                    await supabase.from("posts").update({ status: "published" }).eq("id", job.entity_id);
                }

                // Mark job complete
                await supabase.from("scheduled_jobs").update({ status: "completed" }).eq("id", job.id);
                results.push({ id: job.id, status: "completed" });
            } catch (e: any) {
                await supabase.from("scheduled_jobs").update({ status: "failed", error_message: e.message }).eq("id", job.id);
                results.push({ id: job.id, status: "failed", error: e.message });
            }
        }
    }

    return NextResponse.json({ success: true, processed: results.length, jobs: results });
}
