"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyTab } from "@/components/study-tab";
import { QuizTab } from "@/components/quiz-tab";
import { NotesTab } from "@/components/notes-tab";
import { ResourcesTab } from "@/components/resources-tab";
import type { Section, Topic } from "@/lib/data";
import type { SavedQuizSnapshot } from "@/lib/saved-quizzes";
import { BookOpen, BrainCircuit, FolderOpen, PenLine, Sparkles } from "lucide-react";

interface AppWorkspaceProps {
  topics: Topic[];
  studyTopicIds: string[];
  workspaceReady: boolean;
  sections: Section[];
  /** Active study section title (truncated in Quiz / Flashcard headers). */
  sectionTitle: string | null;
  /** Section driving the workspace Study tab (for section quiz at bottom). */
  activeSection: Section | null;
  onAddStudyTopic: (topicId: string) => void;
  onSaveSectionQuiz: (
    data: Omit<SavedQuizSnapshot, "id"> & { id?: string }
  ) => void;
  workspaceTab: string;
  onWorkspaceTabChange: (value: string) => void;
  savedQuizRemoteRefreshToken: number;
}

function WorkspaceEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/40">
        <Sparkles className="h-7 w-7 text-primary/60" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Study workspace is empty
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Select topics under <span className="font-medium text-foreground">Topics</span> in{" "}
        <span className="font-medium text-foreground">Brief</span>, then click{" "}
        <span className="font-medium text-foreground">Generate Section</span> to unlock Study and Quiz here.{" "}
        <span className="font-medium text-foreground">Notes</span> and{" "}
        <span className="font-medium text-foreground">Resources</span> stay available in the tabs above anytime.
      </p>
    </div>
  );
}

export function AppWorkspace({
  topics,
  studyTopicIds,
  workspaceReady,
  sections,
  sectionTitle,
  activeSection,
  onAddStudyTopic,
  onSaveSectionQuiz,
  workspaceTab,
  onWorkspaceTabChange,
  savedQuizRemoteRefreshToken,
}: AppWorkspaceProps) {
  return (
    <Tabs
      value={workspaceTab}
      onValueChange={onWorkspaceTabChange}
      className="flex h-full flex-col"
    >
      <div className="shrink-0 border-b bg-white px-6">
        <TabsList variant="line" className="h-11">
          <TabsTrigger
            value="study"
            className="gap-1.5 px-4 after:!bg-primary"
          >
            <BookOpen className="h-4 w-4" />
            Study
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="gap-1.5 px-4 after:!bg-primary"
          >
            <BrainCircuit className="h-4 w-4" />
            Quiz
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="gap-1.5 px-4 after:!bg-primary"
          >
            <PenLine className="h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger
            value="resources"
            className="gap-1.5 px-4 after:!bg-primary"
          >
            <FolderOpen className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="study" className="mt-0 flex-1 overflow-hidden">
        {!workspaceReady ? (
          <WorkspaceEmpty />
        ) : (
          <StudyTab
            topics={topics}
            studyTopicIds={studyTopicIds}
            sections={sections}
            activeSection={activeSection}
            onAddStudyTopic={onAddStudyTopic}
            onSaveSectionQuiz={onSaveSectionQuiz}
          />
        )}
      </TabsContent>
      <TabsContent value="quiz" className="mt-0 flex-1 overflow-hidden">
        {!workspaceReady ? (
          <WorkspaceEmpty />
        ) : (
          <QuizTab
            topics={topics}
            studyTopicIds={studyTopicIds}
            sectionTitle={sectionTitle}
            savedQuizRemoteRefreshToken={savedQuizRemoteRefreshToken}
          />
        )}
      </TabsContent>
      <TabsContent value="notes" className="mt-0 flex-1 overflow-hidden">
        <NotesTab topics={topics} studyTopicIds={studyTopicIds} />
      </TabsContent>
      <TabsContent value="resources" className="mt-0 flex-1 overflow-hidden">
        <ResourcesTab />
      </TabsContent>
    </Tabs>
  );
}
