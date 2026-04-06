"use client";

import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppWorkspace } from "@/components/app-workspace";
import { TopHeader } from "@/components/top-header";
import {
  sampleSources,
  sampleTopics,
  sampleStudyContent,
  type Section,
} from "@/lib/data";

export default function Home() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const workspaceReady = sections.length > 0;

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const selectTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev : [...prev, topicId]
    );
  };

  const canGenerateFromSelection = useMemo(() => {
    if (selectedTopics.length === 0) return false;
    const existing = new Set(sections.map((s) => s.topicId));
    return selectedTopics.some(
      (id) => sampleStudyContent[id] && !existing.has(id)
    );
  }, [selectedTopics, sections]);

  const handleGenerateSectionClick = () => {
    if (!canGenerateFromSelection) return;

    const generatedTopicIds = new Set(sections.map((s) => s.topicId));
    const toAdd = selectedTopics.filter(
      (id) => sampleStudyContent[id] && !generatedTopicIds.has(id)
    );

    if (toAdd.length === 0) return;

    const now = Date.now();
    setSections((prev) => {
      const next = [...prev];
      toAdd.forEach((topicId, i) => {
        const topic = sampleTopics.find((t) => t.id === topicId);
        const content = sampleStudyContent[topicId] ?? "";
        const wordCount = content.split(/\s+/).length;
        next.push({
          id: `sec-${now}-${i}`,
          topicId,
          title: topic?.name ?? "Untitled",
          generatedAt: new Date().toISOString().split("T")[0],
          wordCount,
        });
      });
      return next;
    });

    setSelectedTopics((prev) =>
      Array.from(new Set([...prev, ...toAdd]))
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
              selectedTopics={selectedTopics}
              onToggleTopic={toggleTopic}
              sections={sections}
              sources={sampleSources}
              onSelectTopic={selectTopic}
              onGenerateSectionClick={handleGenerateSectionClick}
              generateDisabled={!canGenerateFromSelection}
            />

            <main className="flex-1 overflow-hidden bg-background">
              <AppWorkspace
                topics={sampleTopics}
                selectedTopics={selectedTopics}
                workspaceReady={workspaceReady}
              />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
