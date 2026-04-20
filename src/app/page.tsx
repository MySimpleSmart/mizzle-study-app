"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppWorkspace } from "@/components/app-workspace";
import { ClientOnly } from "@/components/client-only";
import { TopHeader } from "@/components/top-header";
import {
  aiBriefVariants,
  sampleSources,
  sampleTopics,
  sampleStudyContent,
  buildCombinedSectionTitle,
  buildSectionExcerpt,
  sectionTopicSetKey,
  type Section,
} from "@/lib/data";
import { upsertSavedQuiz } from "@/lib/saved-quizzes";

function firstActiveTopicIds(sections: Section[]): string[] {
  const active = sections
    .filter((s) => !s.archived)
    .slice()
    .sort((a, b) => {
      const byDate = b.generatedAt.localeCompare(a.generatedAt);
      if (byDate !== 0) return byDate;
      return b.id.localeCompare(a.id);
    });
  return active.length > 0 ? active[0].topicIds : [];
}

const WORKSPACE_TABS = new Set(["study", "quiz", "notes", "resources"]);

export default function Home() {
  const searchParams = useSearchParams();
  const [briefSelection, setBriefSelection] = useState<string[]>([]);
  const [briefVariantIndex, setBriefVariantIndex] = useState(0);
  const [reanalysePending, setReanalysePending] = useState(false);
  const [headerLastUpdated, setHeaderLastUpdated] = useState("2 hours ago");
  const [studyTopicIds, setStudyTopicIds] = useState<string[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  /** Section currently driving the main workspace; edits (e.g. add topic) sync to this card */
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState("study");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [savedQuizRemoteRefreshToken, setSavedQuizRemoteRefreshToken] =
    useState(0);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && WORKSPACE_TABS.has(tab)) {
      setWorkspaceTab(tab);
      return;
    }
    setWorkspaceTab("study");
  }, [searchParams]);

  const activeSections = useMemo(
    () => sections.filter((s) => !s.archived),
    [sections]
  );

  const workspaceReady = activeSections.length > 0;

  const workspaceSectionTitle = useMemo(() => {
    if (!activeSectionId) return null;
    const s = sections.find((x) => x.id === activeSectionId && !x.archived);
    return s?.title ?? null;
  }, [activeSectionId, sections]);

  const activeSection = useMemo(() => {
    if (!activeSectionId) return null;
    return (
      sections.find((s) => s.id === activeSectionId && !s.archived) ?? null
    );
  }, [activeSectionId, sections]);

  const briefSnapshot = useMemo(
    () =>
      aiBriefVariants[briefVariantIndex % aiBriefVariants.length] ??
      aiBriefVariants[0],
    [briefVariantIndex]
  );

  const handleReanalyseBrief = useCallback(
    (_context: { reasonId: string; detail?: string }) => {
      void _context;
      setReanalysePending(true);
      window.setTimeout(() => {
        setBriefVariantIndex((i) => (i + 1) % aiBriefVariants.length);
        setReanalysePending(false);
        setHeaderLastUpdated(
          new Date().toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })
        );
      }, 1500);
    },
    []
  );

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

  /** Opens section content in the main workspace only; does not change Brief topic chips */
  const openSectionInWorkspace = (sectionId: string, topicIds: string[]) => {
    setStudyTopicIds(topicIds);
    setActiveSectionId(sectionId);
  };

  const handleSaveSectionQuiz = useCallback(
    (data: Parameters<typeof upsertSavedQuiz>[0]) => {
      upsertSavedQuiz(data);
      setSavedQuizRemoteRefreshToken((n) => n + 1);
      setWorkspaceTab("quiz");
    },
    []
  );

  const addStudyTopic = (topicId: string) => {
    setStudyTopicIds((prev) =>
      prev.includes(topicId) ? prev : [...prev, topicId]
    );
    if (!activeSectionId) return;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== activeSectionId) return s;
        if (s.topicIds.includes(topicId)) return s;
        const nextIds = [...s.topicIds, topicId];
        return {
          ...s,
          topicIds: nextIds,
          title: buildCombinedSectionTitle(nextIds, sampleTopics),
          excerpt: buildSectionExcerpt(nextIds, sampleStudyContent),
        };
      })
    );
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

    const newId = `sec-${Date.now()}`;
    setSections((prev) => [
      {
        id: newId,
        topicIds,
        title: buildCombinedSectionTitle(topicIds, sampleTopics),
        excerpt: buildSectionExcerpt(topicIds, sampleStudyContent),
        generatedAt: new Date().toISOString().split("T")[0],
        reviewEditTotal: 0,
        archived: false,
      },
      ...prev,
    ]);

    setStudyTopicIds(topicIds);
    setActiveSectionId(newId);
    setBriefSelection([]);
  };

  const syncStudyAfterRemoveOrArchive = (
    removed: Section,
    nextSections: Section[]
  ) => {
    setActiveSectionId((id) => (id === removed.id ? null : id));
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
              Last updated {headerLastUpdated}
            </span>
          </div>

          <ClientOnly
            fallback={
              <div
                className="flex flex-1 overflow-hidden"
                aria-busy="true"
                aria-label="Loading workspace"
              >
                <aside className="flex h-full w-80 shrink-0 animate-pulse flex-col border-r bg-muted/35" />
                <main className="flex-1 animate-pulse bg-muted/25" />
              </div>
            }
          >
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar
                brief={briefSnapshot}
                reanalysePending={reanalysePending}
                onReanalyse={handleReanalyseBrief}
                topics={sampleTopics}
                selectedTopics={briefSelection}
                onToggleTopic={toggleTopic}
                sections={sections}
                activeSectionCount={activeSections.length}
                sources={sampleSources}
                onSelectTopic={selectTopic}
                onOpenSectionInWorkspace={openSectionInWorkspace}
                onGenerateSectionClick={handleGenerateSectionClick}
                generateDisabled={!canGenerateFromSelection}
                onArchiveSection={archiveSection}
                onRestoreSection={restoreSection}
                onRemoveSection={removeSection}
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() =>
                  setSidebarCollapsed((collapsed) => !collapsed)
                }
              />

              <main className="flex-1 overflow-hidden bg-background">
                <AppWorkspace
                  topics={sampleTopics}
                  studyTopicIds={studyTopicIds}
                  workspaceReady={workspaceReady}
                  sections={sections}
                  sectionTitle={workspaceSectionTitle}
                  activeSection={activeSection}
                  onAddStudyTopic={addStudyTopic}
                  onSaveSectionQuiz={handleSaveSectionQuiz}
                  workspaceTab={workspaceTab}
                  onWorkspaceTabChange={setWorkspaceTab}
                  savedQuizRemoteRefreshToken={savedQuizRemoteRefreshToken}
                />
              </main>
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
