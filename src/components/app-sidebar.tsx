"use client";

import { useState } from "react";
import type { Section, Source, Topic } from "@/lib/data";
import { BriefPanel } from "@/components/brief-panel";
import { SectionsPanel } from "@/components/sections-panel";
import { SourcePanel } from "@/components/source-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  ChevronDown,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarSection = "brief" | "sections" | "source";

interface AppSidebarProps {
  topics: Topic[];
  selectedTopics: string[];
  onToggleTopic: (topicId: string) => void;
  sections: Section[];
  activeSectionCount: number;
  sources: Source[];
  onSelectTopic: (topicId: string) => void;
  onSelectTopicsForSection: (topicIds: string[]) => void;
  onGenerateSectionClick: () => void;
  generateDisabled: boolean;
  onArchiveSection: (sectionId: string) => void;
  onRestoreSection: (sectionId: string) => void;
  onRemoveSection: (sectionId: string) => void;
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
  topics,
  selectedTopics,
  onToggleTopic,
  sections,
  activeSectionCount,
  sources,
  onSelectTopic,
  onSelectTopicsForSection,
  onGenerateSectionClick,
  generateDisabled,
  onArchiveSection,
  onRestoreSection,
  onRemoveSection,
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
    <aside className="flex h-full w-80 shrink-0 flex-col border-r bg-white">
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
                  topics={topics}
                  selectedTopics={selectedTopics}
                  onToggleTopic={onToggleTopic}
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
                  topics={topics}
                  onSelectTopicsForSection={onSelectTopicsForSection}
                  onGenerateSectionClick={onGenerateSectionClick}
                  generateDisabled={generateDisabled}
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
    </aside>
  );
}
