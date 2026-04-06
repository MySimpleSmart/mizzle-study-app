"use client";

import type { Source } from "@/lib/data";
import { sampleSources } from "@/lib/data";
import { SourceBadge } from "@/components/source-badge";
import { AddSourceDialog } from "@/components/add-source-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, MoreHorizontal } from "lucide-react";

export function ResourcesTab() {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Study Resources</h3>
            <p className="text-sm text-muted-foreground">
              {sampleSources.length} source
              {sampleSources.length !== 1 && "s"} uploaded
            </p>
          </div>
          <div className="w-32">
            <AddSourceDialog />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {sampleSources.map((source) => (
            <ResourceCard key={source.id} source={source} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

function ResourceCard({ source }: { source: Source }) {
  return (
    <div className="group rounded-xl border bg-white p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <SourceBadge type={source.type} />
        <button className="rounded-md p-1 text-muted-foreground/30 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <h4 className="mt-2.5 text-sm font-medium text-foreground line-clamp-2">
        {source.title}
      </h4>

      {source.description && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {source.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground/60">
          {source.addedAt}
        </span>
        {source.url && (
          <button className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary">
            Open
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
