"use client";

import { useState } from "react";
import type { Note, Topic } from "@/lib/data";
import { sampleNotes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, PenLine, Plus, Trash2 } from "lucide-react";

interface NotesTabProps {
  topics: Topic[];
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

export function NotesTab({ topics }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>(sampleNotes);
  const [newNote, setNewNote] = useState("");
  const [isWriting, setIsWriting] = useState(false);

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: `n${Date.now()}`,
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
    };
    setNotes([note, ...notes]);
    setNewNote("");
    setIsWriting(false);
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Study Notes</h3>
            <p className="text-sm text-muted-foreground">
              {notes.length} note{notes.length !== 1 && "s"}
            </p>
          </div>
          {!isWriting && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setIsWriting(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Note
            </Button>
          )}
        </div>

        {isWriting && (
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <PenLine className="h-3.5 w-3.5" />
              New Note
            </div>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your thoughts, key takeaways, or reminders..."
              rows={4}
              autoFocus
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsWriting(false);
                  setNewNote("");
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNote}>
                Save Note
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group rounded-xl border bg-white p-4 transition-colors hover:border-primary/20"
            >
              <p className="text-sm leading-relaxed text-foreground/80">
                {note.content}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(note.createdAt)}
                  </span>
                  {note.topicId && topicMap[note.topicId] && (
                    <span className="rounded-full bg-primary/8 px-2 py-0.5 text-primary">
                      {topicMap[note.topicId].name}
                    </span>
                  )}
                </div>
                <button className="rounded-md p-1 text-muted-foreground/30 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
