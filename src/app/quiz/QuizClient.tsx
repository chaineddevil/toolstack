"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import confetti from "canvas-confetti";
import { QUIZ_STEPS } from "@/lib/quiz";
import type { Tool, Post } from "@/lib/db";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function resolveImageSrc(
  storagePath: string | null | undefined,
  fallbackUrl: string | null | undefined
): string | null {
  if (storagePath) {
    return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${storagePath}`;
  }
  return fallbackUrl ?? null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Answers = {
  role: string;
  goals: string[];
  technical: string;
  budget: string;
  workflow: string;
};

type RecommendationResult = {
  slug: string;
  score: number;
  reason: string;
  tool: Tool | null;
};

type QuizResponse = {
  topPick: RecommendationResult;
  alternatives: RecommendationResult[];
  relatedPosts: Post[];
};

// ─── Personalization Helpers ─────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  "solo-creator": "a solo creator",
  "startup-founder": "a startup founder",
  designer: "a designer",
  marketer: "a marketer",
  developer: "a developer",
  "small-business": "a small business owner",
  student: "a student",
  exploring: "exploring your options",
};

const GOAL_LABELS: Record<string, string> = {
  automation: "automate your workflows",
  design: "design better products",
  "no-code": "build without code",
  marketing: "grow your audience",
  "project-mgmt": "manage projects effectively",
  "make-money": "monetize your skills",
  learn: "learn new tools",
};

const TECHNICAL_LABELS: Record<string, string> = {
  beginner: "beginner-friendly tools",
  somewhat: "a balance of simplicity and power",
  very: "advanced, technical tools",
};

const BUDGET_LABELS: Record<string, string> = {
  free: "free tools only",
  "under-20": "tools under $20/mo",
  "20-100": "tools in the $20–$100/mo range",
  "no-limit": "premium tools worth the investment",
};

const WORKFLOW_LABELS: Record<string, string> = {
  simple: "simple and minimal tools",
  "feature-rich": "feature-rich power tools",
  "ai-first": "AI-powered tools",
  visual: "visual, no-code tools",
};

const BUDGET_BULLET: Record<string, string> = {
  free: "Fits your budget — free tier available",
  "under-20": "Fits your preferred budget range",
  "20-100": "Strong value at your investment level",
  "no-limit": "Premium features worth the investment",
};

const WORKFLOW_BULLET: Record<string, string> = {
  simple: "Matches your preference for simplicity",
  "feature-rich": "Packed with the depth you want",
  "ai-first": "Built with AI at its core",
  visual: "Designed for visual, no-code workflows",
};

function buildProfileChecklist(answers: Answers): string[] {
  const items: string[] = [];

  if (answers.role && ROLE_LABELS[answers.role]) {
    items.push(`You're ${ROLE_LABELS[answers.role]}`);
  }

  const primaryGoal = answers.goals[0];
  if (primaryGoal && GOAL_LABELS[primaryGoal]) {
    items.push(`You want to ${GOAL_LABELS[primaryGoal]}`);
  }

  if (answers.technical && TECHNICAL_LABELS[answers.technical]) {
    items.push(`You prefer ${TECHNICAL_LABELS[answers.technical]}`);
  }

  if (answers.budget && BUDGET_LABELS[answers.budget]) {
    items.push(`You're looking for ${BUDGET_LABELS[answers.budget]}`);
  }

  if (answers.workflow && WORKFLOW_LABELS[answers.workflow]) {
    items.push(`You value ${WORKFLOW_LABELS[answers.workflow]}`);
  }

  return items;
}

function buildMatchBullets(answers: Answers): string[] {
  const bullets: string[] = [];

  if (answers.workflow && WORKFLOW_BULLET[answers.workflow]) {
    bullets.push(WORKFLOW_BULLET[answers.workflow]);
  }
  if (answers.budget && BUDGET_BULLET[answers.budget]) {
    bullets.push(BUDGET_BULLET[answers.budget]);
  }

  return bullets.slice(0, 2);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuizClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    role: "",
    goals: [],
    technical: "",
    budget: "",
    workflow: "",
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QuizResponse | null>(null);

  const totalSteps = QUIZ_STEPS.length;
  const currentStep = QUIZ_STEPS[step] ?? null;
  const isComplete = step >= totalSteps;

  // Check if current step has a valid selection
  const canProceed = useCallback(() => {
    if (!currentStep) return false;
    const key = currentStep.id as keyof Answers;
    if (currentStep.type === "multi") {
      return (answers[key] as string[]).length > 0;
    }
    return (answers[key] as string) !== "";
  }, [currentStep, answers]);

  // Handle single-select
  function selectSingle(value: string) {
    if (!currentStep) return;
    const key = currentStep.id as keyof Answers;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  // Handle multi-select toggle
  function toggleMulti(value: string) {
    if (!currentStep) return;
    const key = currentStep.id as keyof Answers;
    setAnswers((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  // Advance to next step
  function goNext() {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      submitQuiz();
    }
  }

  // Go back
  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  // Submit
  async function submitQuiz() {
    setLoading(true);
    setStep(totalSteps); // show loading/results view

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (!res.ok) throw new Error("Quiz submission failed");

      const data = (await res.json()) as QuizResponse;
      setResults(data);
    } catch {
      // Fallback — just show tools page
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  // Auto-advance for single-select after a short delay
  function handleSingleSelect(value: string) {
    selectSingle(value);
    // Small delay for visual feedback before advancing
    setTimeout(() => {
      if (step < totalSteps - 1) {
        setStep((s) => s + 1);
      } else {
        // Last step — build final answers and submit
        const key = currentStep!.id as keyof Answers;
        const finalAnswers = { ...answers, [key]: value };
        setAnswers(finalAnswers);
        setLoading(true);
        setStep(totalSteps);

        fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalAnswers),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Quiz submission failed");
            return res.json();
          })
          .then((data: QuizResponse) => setResults(data))
          .catch(() => setResults(null))
          .finally(() => setLoading(false));
      }
    }, 200);
  }

  // ─── Render: Results ─────────────────────────────────────────────────────

  if (isComplete) {
    if (loading) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
            <p className="text-sm text-[#666]">
              Finding your perfect toolkit...
            </p>
          </div>
        </div>
      );
    }

    if (!results) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold text-[#111]">
              Something went wrong
            </p>
            <p className="text-sm text-[#666]">
              We couldn&apos;t generate your recommendations. Try browsing tools
              instead.
            </p>
            <Link
              href="/tools"
              className="inline-flex items-center rounded-full bg-[#111] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#333]"
            >
              Browse all tools →
            </Link>
          </div>
        </div>
      );
    }

    return <ResultsView results={results} answers={answers} />;
  }

  // ─── Render: Quiz Step ───────────────────────────────────────────────────

  if (!currentStep) return null;

  const key = currentStep.id as keyof Answers;
  const selectedValue = currentStep.type === "multi"
    ? (answers[key] as string[])
    : (answers[key] as string);

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-10">
          <div className="mb-2 flex items-center justify-between text-xs text-[#999]">
            <span>
              Step {step + 1} of {totalSteps}
            </span>
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="text-[#666] transition-colors hover:text-[#111] disabled:invisible"
            >
              ← Back
            </button>
          </div>
          <div className="h-1 w-full rounded-full bg-black/5">
            <div
              className="h-1 rounded-full bg-[#111] transition-all duration-300"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[#111]">
            {currentStep.question}
          </h1>
          <p className="text-sm text-[#666]">{currentStep.subtitle}</p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentStep.options.map((option) => {
            const isSelected =
              currentStep.type === "multi"
                ? (selectedValue as string[]).includes(option.value)
                : selectedValue === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  currentStep.type === "multi"
                    ? toggleMulti(option.value)
                    : handleSingleSelect(option.value)
                }
                className={`flex w-full items-center gap-3 rounded-xl border px-5 py-4 text-left text-sm font-medium transition-all ${
                  isSelected
                    ? "border-[#111] bg-[#111] text-white"
                    : "border-black/10 bg-white text-[#333] hover:border-black/25 hover:bg-[#fafafa]"
                }`}
              >
                {/* Selection indicator */}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isSelected
                      ? "border-white bg-white"
                      : "border-black/20 bg-transparent"
                  }`}
                >
                  {isSelected && (
                    <span
                      className={`block h-2 w-2 rounded-full ${
                        isSelected ? "bg-[#111]" : "bg-transparent"
                      }`}
                    />
                  )}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Continue button for multi-select */}
        {currentStep.type === "multi" && (
          <div className="mt-6">
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="w-full rounded-xl bg-[#111] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {step === totalSteps - 1 ? "See my recommendations" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Results View ────────────────────────────────────────────────────────────

function ResultsView({
  results,
  answers,
}: {
  results: QuizResponse;
  answers: Answers;
}) {
  const { topPick, alternatives, relatedPosts } = results;
  const profileChecklist = buildProfileChecklist(answers);
  const matchBullets = buildMatchBullets(answers);
  const [shared, setShared] = useState(false);

  // Confetti burst on mount
  useEffect(() => {
    const duration = 1500;
    const end = Date.now() + duration;

    function frame() {
      // Left side
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#10b981", "#34d399", "#6ee7b7", "#111111", "#fbbf24"],
        disableForReducedMotion: true,
      });
      // Right side
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#10b981", "#34d399", "#6ee7b7", "#111111", "#fbbf24"],
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }

    frame();
  }, []);

  async function handleShare() {
    const toolNames = [
      topPick.tool?.name,
      ...alternatives.map((a) => a.tool?.name),
    ]
      .filter(Boolean)
      .join(", ");

    const text = `I just found my perfect toolkit on ToolStack: ${toolNames}. Take the quiz to find yours!`;
    const url = window.location.origin + "/quiz";

    if (navigator.share) {
      try {
        await navigator.share({ title: "My ToolStack Results", text, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#111]">
      <div className="mx-auto max-w-2xl px-4">
        {/* ================================================================
            SECTION 1 — YOUR BEST MATCH (Hero Card)
            ================================================================ */}
        {topPick.tool && (
          <section className="pb-10 pt-10 md:pb-12 md:pt-14">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">🥇</span>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#999]">
                Your Best Match
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
              {/* Hero image */}
              {resolveImageSrc(
                topPick.tool.image_path,
                topPick.tool.image_url
              ) && (
                <div className="relative aspect-[2.5/1] w-full overflow-hidden bg-[#f7f7f7]">
                  <Image
                    src={
                      resolveImageSrc(
                        topPick.tool.image_path,
                        topPick.tool.image_url
                      )!
                    }
                    alt={topPick.tool.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 672px"
                    priority
                  />
                </div>
              )}

              <div className="px-6 pb-7 pt-6 md:px-8">
                {/* Tool name + rating */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {topPick.tool.name}
                  </h3>
                  {topPick.tool.rating && (
                    <span className="mt-1 shrink-0 rounded-full bg-[#fafafa] px-2.5 py-1 text-xs font-medium text-[#555]">
                      ★ {topPick.tool.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Personalized reason */}
                <p className="mt-2 text-[15px] leading-relaxed text-[#555]">
                  {topPick.reason}
                </p>

                {/* Match bullets */}
                {matchBullets.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {matchBullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                          <svg
                            className="h-3 w-3 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        </span>
                        <span className="text-sm text-[#444]">{bullet}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                  <a
                    href={topPick.tool.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center rounded-xl bg-[#111] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#333]"
                  >
                    Start with {topPick.tool.name} →
                  </a>
                  <Link
                    href={`/tools/${topPick.tool.slug}`}
                    className="flex flex-1 items-center justify-center rounded-xl border border-black/10 px-5 py-3 text-sm font-medium text-[#444] transition-colors hover:border-black/20 hover:text-[#111]"
                  >
                    Read full review
                  </Link>
                </div>

                {/* Trust line */}
                <p className="mt-3 text-center text-[11px] text-[#bbb]">
                  Free to try · No credit card required
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            SECTION 2 — EMOTIONAL PAYOFF BANNER
            ================================================================ */}
        <section className="pb-10 md:pb-12">
          <div className="rounded-xl border border-black/[0.04] bg-[#fafafa] px-5 py-8 text-center md:px-8">
            {/* Completed progress bar */}
            <div className="mx-auto mb-5 max-w-xs">
              <div className="h-1 w-full rounded-full bg-emerald-500" />
            </div>

            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              You&apos;re set up for success.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#666]">
              Based on your answers, we&apos;ve built a toolkit that matches
              your goals, skills, and budget.
            </p>

            {/* Profile badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5">
              <span className="text-sm">🏆</span>
              <span className="text-xs font-medium text-emerald-700">
                Matched to your profile
              </span>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 3 — HOW YOU GOT HERE (Progress Snapshot)
            ================================================================ */}
        {profileChecklist.length > 0 && (
          <section className="pb-10 md:pb-12">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#999]">
              How you got here
            </h2>
            <div className="rounded-xl border border-black/[0.04] bg-[#fafafa] px-5 py-5 md:px-6">
              <div className="space-y-3">
                {profileChecklist.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <svg
                        className="h-3 w-3 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </span>
                    <span className="text-sm text-[#444]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            SECTION 4 — ALSO GREAT FOR YOU (Alternatives)
            ================================================================ */}
        {alternatives.length > 0 && (
          <section className="pb-10 md:pb-12">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#999]">
              Also great for you
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alternatives.map(
                (alt) =>
                  alt.tool && (
                    <div
                      key={alt.slug}
                      className="flex flex-col rounded-xl border border-black/[0.05] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
                    >
                      {/* Tool image */}
                      {resolveImageSrc(
                        alt.tool.image_path,
                        alt.tool.image_url
                      ) && (
                        <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#f5f5f5]">
                          <Image
                            src={
                              resolveImageSrc(
                                alt.tool.image_path,
                                alt.tool.image_url
                              )!
                            }
                            alt={alt.tool.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 300px"
                          />
                        </div>
                      )}

                      <h3 className="text-base font-semibold text-[#111]">
                        {alt.tool.name}
                      </h3>
                      <p className="mt-1 flex-1 text-[13px] leading-relaxed text-[#666]">
                        {alt.reason}
                      </p>
                      <a
                        href={alt.tool.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex w-full items-center justify-center rounded-lg border border-black/10 px-4 py-2.5 text-[13px] font-medium text-[#333] transition-colors hover:border-black/20 hover:bg-[#fafafa] hover:text-[#111]"
                      >
                        Explore {alt.tool.name} →
                      </a>
                    </div>
                  )
              )}
            </div>
          </section>
        )}

        {/* ================================================================
            SECTION 5 — LEARN & LEVEL UP
            ================================================================ */}
        {relatedPosts.length > 0 && (
          <section className="pb-10 md:pb-12">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#999]">
              Learn &amp; level up
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedPosts.slice(0, 2).map((post) => (
                <Link
                  key={post.id}
                  href={
                    post.post_type === "comparison"
                      ? `/comparisons/${post.slug}`
                      : `/blog/${post.slug}`
                  }
                  className="group flex flex-col rounded-xl border border-black/[0.05] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
                >
                  {/* Post image */}
                  {resolveImageSrc(
                    post.featured_image_path,
                    post.featured_image
                  ) && (
                    <div className="relative mb-3 aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#f5f5f5]">
                      <Image
                        src={
                          resolveImageSrc(
                            post.featured_image_path,
                            post.featured_image
                          )!
                        }
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, 300px"
                      />
                    </div>
                  )}

                  <span className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#bbb]">
                    {post.post_type === "comparison"
                      ? "Comparison"
                      : "Article"}
                  </span>
                  <h3 className="flex-1 text-sm font-semibold leading-snug text-[#111] group-hover:text-[#555]">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#888]">
                      {post.summary}
                    </p>
                  )}
                  <span className="mt-3 text-xs font-medium text-[#111] group-hover:text-[#555]">
                    Read →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ================================================================
            SECTION 6 — NEXT ACTIONS
            ================================================================ */}
        <section className="border-t border-black/[0.04] pb-16 pt-10 md:pb-20">
          <div className="text-center">
            <p className="mb-5 text-sm text-[#999]">
              Not quite right? You can always start over.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-xl border border-black/10 px-6 py-2.5 text-sm font-medium text-[#444] transition-colors hover:border-black/20 hover:text-[#111]"
              >
                Retake the quiz
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 px-6 py-2.5 text-sm font-medium text-[#444] transition-colors hover:border-black/20 hover:text-[#111]"
              >
                {shared ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186z"
                      />
                    </svg>
                    Share your toolkit
                  </>
                )}
              </button>
            </div>

            <p className="mt-8 text-[11px] text-[#ccc]">
              Some links are affiliate links. You pay the same price; we may
              earn a small commission.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
