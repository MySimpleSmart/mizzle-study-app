"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Globe,
  Plus,
  Presentation,
  StickyNote,
  Video,
} from "lucide-react";
import type { SourceType } from "@/lib/data";
import { cn } from "@/lib/utils";

const sourceOptions: { type: SourceType; label: string; icon: React.ReactNode }[] = [
  { type: "youtube", label: "YouTube", icon: <Video className="h-4 w-4" /> },
  { type: "website", label: "Website", icon: <Globe className="h-4 w-4" /> },
  { type: "pdf", label: "PDF", icon: <FileText className="h-4 w-4" /> },
  { type: "slides", label: "Slides", icon: <Presentation className="h-4 w-4" /> },
  { type: "notes", label: "Notes", icon: <StickyNote className="h-4 w-4" /> },
];

export function AddSourceDialog() {
  const [selectedType, setSelectedType] = useState<SourceType>("youtube");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full gap-1.5" />
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add Source
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Study Source</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {sourceOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setSelectedType(opt.type)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  selectedType === opt.type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {selectedType === "notes" ? (
            <div className="space-y-2">
              <Input placeholder="Note title" />
              <Textarea placeholder="Write your notes here..." rows={5} />
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder={
                  selectedType === "pdf"
                    ? "Upload or paste a link to your PDF"
                    : "Paste URL here"
                }
              />
              <Input placeholder="Title (optional)" />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Add Source
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
