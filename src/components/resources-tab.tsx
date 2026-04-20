"use client";

import { useMemo } from "react";
import type { Source } from "@/lib/data";
import { sampleSources } from "@/lib/data";
import { SourceBadge } from "@/components/source-badge";
import { AddSourceDialog } from "@/components/add-source-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ExternalLink,
  FileStack,
  FolderOpen,
  Link2,
  MoreHorizontal,
  NotebookPen,
} from "lucide-react";

const statIconCls = "h-3.5 w-3.5 shrink-0 opacity-80";
const statSepCls =
  "inline-flex h-4 shrink-0 select-none items-center text-muted-foreground/45";

export function ResourcesTab() {
  const sourceStats = useMemo(() => {
    let linkSources = 0;
    let fileSources = 0;
    let noteSources = 0;

    for (const source of sampleSources) {
      if (source.type === "youtube" || source.type === "website") {
        linkSources += 1;
        continue;
      }
      if (source.type === "notes") {
        noteSources += 1;
        continue;
      }
      fileSources += 1;
    }

    return {
      total: sampleSources.length,
      linkSources,
      fileSources,
      noteSources,
    };
  }, []);

  const resourcesScopeAriaLabel = `${sourceStats.total} total source${
    sourceStats.total === 1 ? "" : "s"
  }. ${sourceStats.linkSources} link source${
    sourceStats.linkSources === 1 ? "" : "s"
  }. ${sourceStats.fileSources} file source${
    sourceStats.fileSources === 1 ? "" : "s"
  }. ${sourceStats.noteSources} custom note${
    sourceStats.noteSources === 1 ? "" : "s"
  }.`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col border-b bg-background">
        <div className="flex min-h-11 content-center items-center px-6 py-2">
          <div
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-left text-[11px] leading-tight text-muted-foreground sm:text-xs"
            role="status"
            aria-label={resourcesScopeAriaLabel}
          >
            <span className="inline-flex items-center gap-1">
              <FileStack className={statIconCls} aria-hidden />
              <span>
                {sourceStats.total} total source
                {sourceStats.total === 1 ? "" : "s"}
              </span>
            </span>
            <span className={statSepCls} aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Link2 className={statIconCls} aria-hidden />
              <span>
                {sourceStats.linkSources} link source
                {sourceStats.linkSources === 1 ? "" : "s"}
              </span>
            </span>
            <span className={statSepCls} aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <FileStack className={statIconCls} aria-hidden />
              <span>
                {sourceStats.fileSources} file source
                {sourceStats.fileSources === 1 ? "" : "s"}
              </span>
            </span>
            <span className={statSepCls} aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <NotebookPen className={statIconCls} aria-hidden />
              <span>
                {sourceStats.noteSources} custom note
                {sourceStats.noteSources === 1 ? "" : "s"}
              </span>
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Study Resources</h3>
            </div>
            <div className="w-32">
              <AddSourceDialog triggerVariant="default" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {sampleSources.map((source) => (
              <ResourceCard key={source.id} source={source} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
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
