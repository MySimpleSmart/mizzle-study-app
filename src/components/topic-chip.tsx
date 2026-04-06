"use client";

import { cn } from "@/lib/utils";

interface TopicChipProps {
  name: string;
  selected: boolean;
  onToggle: () => void;
}

export function TopicChip({ name, selected, onToggle }: TopicChipProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          selected ? "bg-primary" : "bg-muted-foreground/40"
        )}
      />
      {name}
    </button>
  );
}
