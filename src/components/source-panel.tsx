"use client";

import type { Source } from "@/lib/data";
import { SourceBadge } from "@/components/source-badge";
import { AddSourceDialog } from "@/components/add-source-dialog";
import { ExternalLink } from "lucide-react";

interface SourcePanelProps {
  sources: Source[];
}

export function SourcePanel({ sources }: SourcePanelProps) {
  return (
    <div className="space-y-3">
      <AddSourceDialog />

      {sources.map((source) => (
        <div
          key={source.id}
          className="group rounded-lg border bg-white p-3 transition-colors hover:border-primary/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SourceBadge type={source.type} />
              </div>
              <p className="mt-1.5 text-sm font-medium text-foreground line-clamp-2">
                {source.title}
              </p>
              {source.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {source.description}
                </p>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground/60">
                Added {source.addedAt}
              </p>
            </div>
            {source.url && (
              <button className="shrink-0 rounded-md p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:text-primary group-hover:opacity-100">
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
