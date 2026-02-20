"use client";

interface CharCounterProps {
  current: number;
  max: number;
}

export default function CharCounter({ current, max }: CharCounterProps) {
  const ratio = current / max;
  let color = "text-gray-400";
  if (ratio >= 1) color = "text-red-500 font-medium";
  else if (ratio >= 0.8) color = "text-amber-500";

  return (
    <span className={`text-xs ${color}`}>
      {current}/{max}
    </span>
  );
}
