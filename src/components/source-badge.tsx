"use client";

import type { SourceType } from "@/lib/data";
import {
  FileText,
  Globe,
  Presentation,
  StickyNote,
  Video,
  FileSpreadsheet,
} from "lucide-react";
import type { ReactNode } from "react";

const sourceConfig: Record<SourceType, { icon: ReactNode; label: string }> = {
  youtube: { icon: <Video className="h-3.5 w-3.5" />, label: "YouTube" },
  website: { icon: <Globe className="h-3.5 w-3.5" />, label: "Website" },
  pdf: { icon: <FileText className="h-3.5 w-3.5" />, label: "PDF" },
  slides: {
    icon: <Presentation className="h-3.5 w-3.5" />,
    label: "Slides",
  },
  word: { icon: <FileText className="h-3.5 w-3.5" />, label: "Word" },
  powerpoint: {
    icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
    label: "PowerPoint",
  },
  notes: { icon: <StickyNote className="h-3.5 w-3.5" />, label: "Notes" },
};

interface SourceBadgeProps {
  type: SourceType;
}

export function SourceBadge({ type }: SourceBadgeProps) {
  const config = sourceConfig[type];
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
      {config.icon}
      {config.label}
    </span>
  );
}
