"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Note, Topic } from "@/lib/data";
import { noteTopicIds } from "@/lib/data";
import {
  htmlToPlainText,
  loadStudyNotes,
  saveStudyNotes,
} from "@/lib/notes-storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Clock,
  ListChecks,
  NotebookPen,
  PenLine,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";

const NoteRichEditor = dynamic(
  () =>
    import("@/components/note-rich-editor").then((m) => ({
      default: m.NoteRichEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="h-10 border-b bg-muted/50" />
        <div className="flex min-h-[280px] items-center justify-center px-4 text-sm text-muted-foreground">
          Loading editor…
        </div>
      </div>
    ),
  }
);

interface NotesTabProps {
  topics: Topic[];
  /** Current study scope (sidebar / brief), for “notes for current study”. */
  studyTopicIds: string[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Topic rows for a note in the same order as the `topics` list. */
function topicsForNote(note: Note, topics: Topic[]): Topic[] {
  const idSet = new Set(noteTopicIds(note));
  return topics.filter((t) => idSet.has(t.id));
}

const statIconCls = "h-3.5 w-3.5 shrink-0 opacity-80";
const statSepCls =
  "inline-flex h-4 shrink-0 select-none items-center text-muted-foreground/45";

export function NotesTab({ topics, studyTopicIds }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  /** When set, composer updates this note instead of creating one. */
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftHtml, setDraftHtml] = useState("");
  const [draftTopicIds, setDraftTopicIds] = useState<string[]>([]);
  const [editorMountKey, setEditorMountKey] = useState(0);
  const [pendingRemoveNote, setPendingRemoveNote] = useState<Note | null>(
    null
  );

  useEffect(() => {
    setNotes(loadStudyNotes());
  }, []);

  const hasStudyScope = studyTopicIds.length > 0;

  const noteStats = useMemo(() => {
    const studySet = new Set(studyTopicIds);
    let notesForStudy = 0;
    const topicIdSet = new Set<string>();

    for (const n of notes) {
      const ids = noteTopicIds(n);
      for (const id of ids) topicIdSet.add(id);
      if (hasStudyScope && ids.some((id) => studySet.has(id))) {
        notesForStudy += 1;
      }
    }

    return {
      total: notes.length,
      notesForStudy,
      uniqueTopicsInNotes: topicIdSet.size,
    };
  }, [notes, studyTopicIds, hasStudyScope]);

  const notesScopeAriaLabel = useMemo(() => {
    const { total, notesForStudy, uniqueTopicsInNotes } = noteStats;
    const studyPart = hasStudyScope
      ? `${notesForStudy} note${notesForStudy === 1 ? "" : "s"} for current study`
      : "No study topics";
    return `${studyPart}. ${total} saved note${total === 1 ? "" : "s"}. ${uniqueTopicsInNotes} topic${uniqueTopicsInNotes === 1 ? "" : "s"} in notes.`;
  }, [noteStats, hasStudyScope]);

  const removeNoteConfirmDescription = useMemo(() => {
    if (!pendingRemoveNote) return "";
    const excerpt = htmlToPlainText(pendingRemoveNote.content);
    const preview =
      excerpt.length > 120 ? `${excerpt.slice(0, 120).trim()}…` : excerpt;
    return preview
      ? `This will permanently delete this note ("${preview}"). You cannot undo this action.`
      : "This will permanently delete this note. You cannot undo this action.";
  }, [pendingRemoveNote]);

  const confirmRemoveNote = useCallback(() => {
    if (!pendingRemoveNote) return;
    const id = pendingRemoveNote.id;
    setPendingRemoveNote(null);
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveStudyNotes(next);
      return next;
    });
  }, [pendingRemoveNote]);

  const openComposer = () => {
    setEditingNoteId(null);
    setDraftHtml("");
    setDraftTopicIds([]);
    setEditorMountKey((k) => k + 1);
    setIsWriting(true);
  };

  const openEditNote = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setDraftHtml(note.content);
    setDraftTopicIds(noteTopicIds(note));
    setEditorMountKey((k) => k + 1);
    setIsWriting(true);
  }, []);

  const toggleDraftTopic = useCallback((topicId: string) => {
    setDraftTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  }, []);

  const closeComposer = useCallback(() => {
    setIsWriting(false);
    setEditingNoteId(null);
    setDraftHtml("");
    setDraftTopicIds([]);
  }, []);

  const handleSaveNote = useCallback(() => {
    const plain = htmlToPlainText(draftHtml);
    if (!plain) return;

    if (editingNoteId) {
      setNotes((prev) => {
        const next = prev.map((n) => {
          if (n.id !== editingNoteId) return n;
          const { topicId: _legacy, topicIds: _oldIds, ...rest } = n;
          if (draftTopicIds.length > 0) {
            return {
              ...rest,
              content: draftHtml,
              topicIds: draftTopicIds,
            };
          }
          return {
            ...rest,
            content: draftHtml,
          };
        });
        saveStudyNotes(next);
        return next;
      });
    } else {
      const note: Note = {
        id: `n${Date.now()}`,
        content: draftHtml,
        createdAt: new Date().toISOString(),
        ...(draftTopicIds.length > 0 ? { topicIds: draftTopicIds } : {}),
      };
      setNotes((prev) => {
        const next = [note, ...prev];
        saveStudyNotes(next);
        return next;
      });
    }
    closeComposer();
    setEditorMountKey((k) => k + 1);
  }, [draftHtml, draftTopicIds, editingNoteId, closeComposer]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!isWriting && (
        <div className="flex shrink-0 flex-col border-b bg-background">
          <div className="flex min-h-11 content-center items-center px-6 py-2">
            <div
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-left text-[11px] leading-tight text-muted-foreground sm:text-xs"
              role="status"
              aria-label={notesScopeAriaLabel}
            >
              {hasStudyScope ? (
                <span className="inline-flex items-center gap-1">
                  <ListChecks className={statIconCls} aria-hidden />
                  <span>
                    {noteStats.notesForStudy} note
                    {noteStats.notesForStudy === 1 ? "" : "s"} for current study
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <BookOpen className={statIconCls} aria-hidden />
                  <span>No study topics</span>
                </span>
              )}
              <span className={statSepCls} aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <Bookmark className={statIconCls} aria-hidden />
                <span>
                  {noteStats.total} saved note{noteStats.total === 1 ? "" : "s"}
                </span>
              </span>
              <span className={statSepCls} aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <Tags className={statIconCls} aria-hidden />
                <span>
                  {noteStats.uniqueTopicsInNotes} topic
                  {noteStats.uniqueTopicsInNotes === 1 ? "" : "s"} in notes
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-6">
        <Dialog
          open={pendingRemoveNote !== null}
          onOpenChange={(open) => {
            if (!open) setPendingRemoveNote(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remove note?</DialogTitle>
              <DialogDescription>
                {removeNoteConfirmDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingRemoveNote(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmRemoveNote}
              >
                Remove
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {!isWriting && (
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <NotebookPen
                className="h-5 w-5 shrink-0 text-primary"
                aria-hidden
              />
              <h3 className="min-w-0 text-lg font-semibold tracking-tight text-foreground">
                Study notes
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Button
                type="button"
                className="shrink-0 gap-1.5"
                onClick={openComposer}
              >
                <Plus className="h-4 w-4" aria-hidden />
                New note
              </Button>
            </div>
          </div>
        )}

        {isWriting && (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <PenLine className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {editingNoteId ? "Edit note" : "New note"}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={closeComposer}
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  Back to notes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={!htmlToPlainText(draftHtml)}
                >
                  {editingNoteId ? "Save changes" : "Save note"}
                </Button>
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <span
                id="note-topics-label"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Topics
              </span>
              <p className="text-xs text-muted-foreground">
                Optional — select none, one, or multiple.
              </p>
              <div
                role="group"
                aria-labelledby="note-topics-label"
                className="rounded-lg border border-border/60 bg-muted/15 p-3 sm:p-4"
              >
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleDraftTopic(topic.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                        draftTopicIds.includes(topic.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          draftTopicIds.includes(topic.id)
                            ? "bg-primary"
                            : "bg-muted-foreground/40"
                        )}
                      />
                      {topic.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <NoteRichEditor
              key={`${editingNoteId ?? "new"}-${editorMountKey}`}
              initialHtml={draftHtml}
              onChange={setDraftHtml}
            />
          </div>
        )}

        {!isWriting && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {notes.map((note) => (
            <article
              key={note.id}
              className="group flex h-full min-h-[11rem] flex-col rounded-xl border border-border/80 bg-white p-4 shadow-sm transition-colors hover:border-primary/25 hover:shadow-md"
            >
              {(() => {
                const ordered = topicsForNote(note, topics);
                if (ordered.length === 0) return null;
                const [first, ...more] = ordered;
                const title = ordered.map((t) => t.name).join(", ");
                return (
                  <span
                    className="mb-2 flex max-w-full min-w-0 flex-wrap items-center gap-1.5 self-start rounded-full bg-primary/8 px-2 py-0.5 text-xs text-primary"
                    title={title}
                  >
                    <span className="min-w-0 truncate">{first.name}</span>
                    {more.length > 0 && (
                      <span
                        className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0 text-[10px] font-semibold text-primary tabular-nums"
                        aria-label={`${more.length} more topic${more.length !== 1 ? "s" : ""}`}
                      >
                        +{more.length}
                      </span>
                    )}
                  </span>
                );
              })()}
              <p
                className="line-clamp-5 text-sm leading-relaxed break-words text-foreground/80"
                title={htmlToPlainText(note.content)}
              >
                {htmlToPlainText(note.content)}
              </p>
              <div className="mt-auto flex flex-nowrap items-center gap-2 border-t border-border/50 pt-3">
                <span className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-[11px] font-medium text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" aria-hidden />
                  {formatDate(note.createdAt)}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label="Remove note"
                    onClick={() => setPendingRemoveNote(note)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openEditNote(note)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
        </div>
      </ScrollArea>
    </div>
  );
}
