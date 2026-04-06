"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyTab } from "@/components/study-tab";
import { QuizTab } from "@/components/quiz-tab";
import { NotesTab } from "@/components/notes-tab";
import { ResourcesTab } from "@/components/resources-tab";
import type { Topic } from "@/lib/data";
import { BookOpen, BrainCircuit, FolderOpen, PenLine, Sparkles } from "lucide-react";

interface AppWorkspaceProps {
  topics: Topic[];
  selectedTopics: string[];
  workspaceReady: boolean;
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
        Select one or more topics in <span className="font-medium text-foreground">Brief</span>, then click{" "}
        <span className="font-medium text-foreground">Generate Section</span> in Sections. Your notes, quizzes, and study material will appear here after generation.
      </p>
    </div>
  );
}

export function AppWorkspace({
  topics,
  selectedTopics,
  workspaceReady,
}: AppWorkspaceProps) {
  return (
    <Tabs defaultValue="study" className="flex h-full flex-col">
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

      {!workspaceReady ? (
        <WorkspaceEmpty />
      ) : (
        <>
          <TabsContent value="study" className="mt-0 flex-1 overflow-hidden">
            <StudyTab topics={topics} selectedTopics={selectedTopics} />
          </TabsContent>
          <TabsContent value="quiz" className="mt-0 flex-1 overflow-hidden">
            <QuizTab topics={topics} selectedTopics={selectedTopics} />
          </TabsContent>
          <TabsContent value="notes" className="mt-0 flex-1 overflow-hidden">
            <NotesTab topics={topics} />
          </TabsContent>
          <TabsContent value="resources" className="mt-0 flex-1 overflow-hidden">
            <ResourcesTab />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
