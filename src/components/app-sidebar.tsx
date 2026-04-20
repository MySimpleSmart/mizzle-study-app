"use client";

import { useState } from "react";
import type { ReanalyseContext } from "@/components/brief-panel";
import type { AiBriefSnapshot, Section, Source, Topic } from "@/lib/data";
import { BriefPanel } from "@/components/brief-panel";
import { SectionsPanel } from "@/components/sections-panel";
import { SourcePanel } from "@/components/source-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarSection = "brief" | "sections" | "source";

interface AppSidebarProps {
  brief: AiBriefSnapshot;
  reanalysePending?: boolean;
  onReanalyse: (context: ReanalyseContext) => void;
  topics: Topic[];
  selectedTopics: string[];
  onToggleTopic: (topicId: string) => void;
  sections: Section[];
  activeSectionCount: number;
  sources: Source[];
  onSelectTopic: (topicId: string) => void;
  onOpenSectionInWorkspace: (sectionId: string, topicIds: string[]) => void;
  onGenerateSectionClick: () => void;
  generateDisabled: boolean;
  onArchiveSection: (sectionId: string) => void;
  onRestoreSection: (sectionId: string) => void;
  onRemoveSection: (sectionId: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function SidebarSectionHeader({
  title,
  icon,
  isOpen,
  onToggle,
  count,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
    >
      {icon}
      <span className="flex-1 text-left">{title}</span>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {count}
        </span>
      )}
      <ChevronDown
        className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          !isOpen && "-rotate-90"
        )}
      />
    </button>
  );
}

export function AppSidebar({
  brief,
  reanalysePending,
  onReanalyse,
  topics,
  selectedTopics,
  onToggleTopic,
  sections,
  activeSectionCount,
  sources,
  onSelectTopic,
  onOpenSectionInWorkspace,
  onGenerateSectionClick,
  generateDisabled,
  onArchiveSection,
  onRestoreSection,
  onRemoveSection,
  collapsed,
  onToggleCollapsed,
}: AppSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<SidebarSection, boolean>>({
    brief: true,
    sections: true,
    source: true,
  });

  const toggle = (section: SidebarSection) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col border-r bg-white transition-[width] duration-200",
        collapsed ? "w-14" : "w-80"
      )}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute top-5 -right-3 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {collapsed ? (
        <div className="flex flex-1 flex-col items-center gap-2 py-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
            title="Brief"
            aria-label="Brief"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
            title="Sections"
            aria-label="Sections"
          >
            <BookOpen className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
            title="Sources"
            aria-label="Sources"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      ) : (
      <ScrollArea className="flex-1">
        <div className="divide-y">
          <div>
            <SidebarSectionHeader
              title="Brief"
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              isOpen={openSections.brief}
              onToggle={() => toggle("brief")}
            />
            {openSections.brief && (
              <div className="px-4 pt-5 pb-4">
                <BriefPanel
                  brief={brief}
                  topics={topics}
                  selectedTopics={selectedTopics}
                  onToggleTopic={onToggleTopic}
                  onReanalyse={onReanalyse}
                  reanalysePending={reanalysePending}
                  onGenerateSectionClick={onGenerateSectionClick}
                  generateDisabled={generateDisabled}
                />
              </div>
            )}
          </div>

          <div>
            <SidebarSectionHeader
              title="Sections"
              icon={<BookOpen className="h-4 w-4 text-primary" />}
              isOpen={openSections.sections}
              onToggle={() => toggle("sections")}
              count={activeSectionCount}
            />
            {openSections.sections && (
              <div className="px-4 pt-5 pb-4">
                <SectionsPanel
                  sections={sections}
                  onOpenSectionInWorkspace={onOpenSectionInWorkspace}
                  onArchiveSection={onArchiveSection}
                  onRestoreSection={onRestoreSection}
                  onRemoveSection={onRemoveSection}
                />
              </div>
            )}
          </div>

          <div>
            <SidebarSectionHeader
              title="Source"
              icon={<FileText className="h-4 w-4 text-primary" />}
              isOpen={openSections.source}
              onToggle={() => toggle("source")}
              count={sources.length}
            />
            {openSections.source && (
              <div className="px-4 pt-5 pb-4">
                <SourcePanel sources={sources} />
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      )}
    </aside>
  );
}
