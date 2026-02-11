"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useCallback } from "react";
import Link from "next/link";
import { QUIZ_STEPS } from "@/lib/quiz";
import type { Tool, Post } from "@/lib/db";

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
        // Last step — submit
        setAnswers((prev) => {
          const key = currentStep!.id as keyof Answers;
          const updated = { ...prev, [key]: value };
          // We need to submit with the updated answers
          setLoading(true);
          setStep(totalSteps);
          fetch("/api/quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          })
            .then((res) => res.json())
            .then((data: QuizResponse) => setResults(data))
            .catch(() => setResults(null))
            .finally(() => setLoading(false));
          return updated;
        });
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

    return <ResultsView results={results} />;
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

function ResultsView({ results }: { results: QuizResponse }) {
  const { topPick, alternatives, relatedPosts } = results;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-[#111]">
      {/* Header */}
      <header className="mb-10 text-center">
        <p className="mb-2 text-sm font-medium text-[#999]">
          Your quiz results
        </p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Your personalized toolkit
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          Based on your answers, here&apos;s what we recommend.
        </p>
      </header>

      {/* ── Section A: Top Pick ── */}
      {topPick.tool && (
        <section className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#999]">
            Top Pick
          </p>
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            {topPick.tool.image_url && (
              <div className="aspect-[3/1] w-full overflow-hidden bg-[#f5f5f5]">
                <img
                  src={topPick.tool.image_url}
                  alt={topPick.tool.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{topPick.tool.name}</h2>
                  <p className="text-sm text-[#666]">
                    {topPick.tool.tagline}
                  </p>
                </div>
                {topPick.tool.rating && (
                  <span className="shrink-0 text-sm font-medium text-[#666]">
                    ★ {topPick.tool.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="mt-4 rounded-lg bg-[#fafafa] px-4 py-3">
                <p className="text-xs font-medium text-[#999]">
                  Why we picked this for you
                </p>
                <p className="mt-1 text-sm text-[#444]">{topPick.reason}</p>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <a
                  href={topPick.tool.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center rounded-xl bg-[#111] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#333]"
                >
                  Try {topPick.tool.name} →
                </a>
                <Link
                  href={`/tools/${topPick.tool.slug}`}
                  className="flex flex-1 items-center justify-center rounded-xl border border-black/10 px-5 py-3 text-sm font-medium text-[#444] transition-colors hover:border-black/25 hover:text-[#111]"
                >
                  Read full review
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Section B: Alternatives ── */}
      {alternatives.length > 0 && (
        <section className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#999]">
            Also worth exploring
          </p>
          <div className="space-y-3">
            {alternatives.map(
              (alt) =>
                alt.tool && (
                  <div
                    key={alt.slug}
                    className="flex items-center gap-4 rounded-xl border border-black/5 bg-white p-4 transition-shadow hover:shadow-sm"
                  >
                    {alt.tool.image_url && (
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f5f5f5]">
                        <img
                          src={alt.tool.image_url}
                          alt={alt.tool.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[#111]">
                        {alt.tool.name}
                      </h3>
                      <p className="line-clamp-1 text-xs text-[#666]">
                        {alt.reason}
                      </p>
                    </div>
                    <a
                      href={alt.tool.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg bg-[#111] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#333]"
                    >
                      Explore →
                    </a>
                  </div>
                )
            )}
          </div>
        </section>
      )}

      {/* ── Section C: Related Articles ── */}
      {relatedPosts.length > 0 && (
        <section className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#999]">
            Learn more
          </p>
          <div className="space-y-2">
            {relatedPosts.map((post) => (
              <Link
                key={post.id}
                href={
                  post.post_type === "comparison"
                    ? `/comparisons/${post.slug}`
                    : `/blog/${post.slug}`
                }
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-[#fafafa] p-4 text-sm transition-shadow hover:shadow-sm"
              >
                <span className="text-lg">📖</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#111]">{post.title}</p>
                  {post.summary && (
                    <p className="line-clamp-1 text-xs text-[#666]">
                      {post.summary}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs font-medium text-[#111]">
                  Read →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <div className="rounded-xl border border-black/5 bg-[#fafafa] p-6 text-center">
        <p className="text-sm text-[#666]">
          Want to explore more tools?
        </p>
        <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/tools"
            className="inline-flex items-center justify-center rounded-xl bg-[#111] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
          >
            Browse all tools
          </Link>
          <button
            type="button"
            onClick={() => {
              // Reset quiz
              window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-xl border border-black/10 px-5 py-2.5 text-sm font-medium text-[#444] transition-colors hover:border-black/25 hover:text-[#111]"
          >
            Retake the quiz
          </button>
        </div>
        <p className="mt-3 text-[11px] text-[#999]">
          Affiliate links. You pay the same price; we may earn a small
          commission.
        </p>
      </div>
    </div>
  );
}
