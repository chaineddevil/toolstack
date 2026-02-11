import { NextRequest, NextResponse } from "next/server";
import { saveQuizResponse, getToolsBySlugs, getPostsBySlugs } from "@/lib/db";
import { getRecommendations, type QuizAnswers } from "@/lib/quiz";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<QuizAnswers>;

  if (
    !body.role ||
    !body.goals ||
    !Array.isArray(body.goals) ||
    !body.technical ||
    !body.budget ||
    !body.workflow
  ) {
    return NextResponse.json(
      { error: "All quiz fields are required." },
      { status: 400 }
    );
  }

  const answers: QuizAnswers = {
    role: body.role,
    goals: body.goals,
    technical: body.technical,
    budget: body.budget,
    workflow: body.workflow,
  };

  // Run recommendation engine
  const result = getRecommendations(answers);

  // Store anonymously
  try {
    await saveQuizResponse({
      ...answers,
      top_pick_slug: result.topPick.slug,
    });
  } catch {
    // Non-blocking — don't fail the request if storage fails
  }

  // Hydrate tools
  const allToolSlugs = [
    result.topPick.slug,
    ...result.alternatives.map((a) => a.slug),
  ];
  const tools = await getToolsBySlugs(allToolSlugs);
  const toolMap = new Map(tools.map((t) => [t.slug, t]));

  // Hydrate posts
  const posts = await getPostsBySlugs(result.relatedPostSlugs);

  return NextResponse.json({
    topPick: {
      ...result.topPick,
      tool: toolMap.get(result.topPick.slug) ?? null,
    },
    alternatives: result.alternatives.map((alt) => ({
      ...alt,
      tool: toolMap.get(alt.slug) ?? null,
    })),
    relatedPosts: posts,
  });
}
