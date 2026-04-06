"use client";

import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppWorkspace } from "@/components/app-workspace";
import { TopHeader } from "@/components/top-header";
import {
  sampleSources,
  sampleTopics,
  sampleStudyContent,
  buildCombinedSectionTitle,
  buildSectionExcerpt,
  sectionTopicSetKey,
  type Section,
} from "@/lib/data";

function firstActiveTopicIds(sections: Section[]): string[] {
  const active = sections.filter((s) => !s.archived);
  return active.length > 0 ? active[0].topicIds : [];
}

export default function Home() {
  const [briefSelection, setBriefSelection] = useState<string[]>([]);
  const [studyTopicIds, setStudyTopicIds] = useState<string[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const activeSections = useMemo(
    () => sections.filter((s) => !s.archived),
    [sections]
  );

  const workspaceReady = activeSections.length > 0;

  const toggleTopic = (topicId: string) => {
    setBriefSelection((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const selectTopic = (topicId: string) => {
    setBriefSelection((prev) =>
      prev.includes(topicId) ? prev : [...prev, topicId]
    );
  };

  const selectTopicsForSection = (topicIds: string[]) => {
    setBriefSelection(topicIds);
    setStudyTopicIds(topicIds);
  };

  const canGenerateFromSelection = useMemo(() => {
    if (briefSelection.length === 0) return false;
    const ids = briefSelection.filter((id) => sampleStudyContent[id]);
    if (ids.length === 0) return false;
    const key = sectionTopicSetKey(ids);
    const duplicate = activeSections.some(
      (s) => sectionTopicSetKey(s.topicIds) === key
    );
    return !duplicate;
  }, [briefSelection, activeSections]);

  const handleGenerateSectionClick = () => {
    const topicIds = briefSelection.filter((id) => sampleStudyContent[id]);
    if (topicIds.length === 0) return;
    if (
      activeSections.some(
        (s) => sectionTopicSetKey(s.topicIds) === sectionTopicSetKey(topicIds)
      )
    ) {
      return;
    }

    setSections((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}`,
        topicIds,
        title: buildCombinedSectionTitle(topicIds, sampleTopics),
        excerpt: buildSectionExcerpt(topicIds, sampleStudyContent),
        generatedAt: new Date().toISOString().split("T")[0],
        reviewEditTotal: 0,
        archived: false,
      },
    ]);

    setStudyTopicIds(topicIds);
    setBriefSelection([]);
  };

  const syncStudyAfterRemoveOrArchive = (
    removed: Section,
    nextSections: Section[]
  ) => {
    setStudyTopicIds((study) => {
      if (sectionTopicSetKey(removed.topicIds) !== sectionTopicSetKey(study)) {
        return study;
      }
      return firstActiveTopicIds(nextSections);
    });
    setBriefSelection((brief) =>
      sectionTopicSetKey(brief) === sectionTopicSetKey(removed.topicIds)
        ? []
        : brief
    );
  };

  const removeSection = (sectionId: string) => {
    const removed = sections.find((s) => s.id === sectionId);
    const nextSections = sections.filter((s) => s.id !== sectionId);
    setSections(nextSections);
    if (!removed) return;
    syncStudyAfterRemoveOrArchive(removed, nextSections);
  };

  const archiveSection = (sectionId: string) => {
    const removed = sections.find((s) => s.id === sectionId);
    if (!removed) return;
    const nextSections = sections.map((s) =>
      s.id === sectionId ? { ...s, archived: true } : s
    );
    setSections(nextSections);
    syncStudyAfterRemoveOrArchive(removed, nextSections);
  };

  const restoreSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, archived: false } : s
      )
    );
  };

  return (
    <div className="flex h-screen flex-col">
      <TopHeader />

      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 pt-0">
        <div className="flex h-full max-h-[850px] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex h-11 shrink-0 items-center justify-between border-b px-5">
            <div className="flex items-center gap-1">
              <h1 className="text-sm font-medium">
                Introduction to Machine Learning
              </h1>
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                6 topics
              </span>
            </div>

            <span className="text-xs text-muted-foreground">
              Last updated 2 hours ago
            </span>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <AppSidebar
              topics={sampleTopics}
              selectedTopics={briefSelection}
              onToggleTopic={toggleTopic}
              sections={sections}
              activeSectionCount={activeSections.length}
              sources={sampleSources}
              onSelectTopic={selectTopic}
              onSelectTopicsForSection={selectTopicsForSection}
              onGenerateSectionClick={handleGenerateSectionClick}
              generateDisabled={!canGenerateFromSelection}
              onArchiveSection={archiveSection}
              onRestoreSection={restoreSection}
              onRemoveSection={removeSection}
            />

            <main className="flex-1 overflow-hidden bg-background">
              <AppWorkspace
                topics={sampleTopics}
                studyTopicIds={studyTopicIds}
                workspaceReady={workspaceReady}
              />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
