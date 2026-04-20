"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopHeader } from "@/components/top-header";
import { cn } from "@/lib/utils";

const LINK_SOURCE_OPTIONS = ["Youtube", "Website", "Google Slides"] as const;
const FILE_SOURCE_OPTIONS = ["PDF", "Word", "PowerPoint", "Custom Note"] as const;
const LINKS_DISABLED = true;
const DEMO_RECENT_SECTIONS = [
  {
    id: "sec-ml-intro",
    title: "Intro to Machine Learning",
    source: "Youtube",
    updatedAt: "2h ago",
    progress: "4/7 topics",
  },
  {
    id: "sec-stat-basics",
    title: "Statistics Basics",
    source: "PDF",
    updatedAt: "Yesterday",
    progress: "2/5 topics",
  },
  {
    id: "sec-nn-foundations",
    title: "Neural Network Foundations",
    source: "Google Slides",
    updatedAt: "3 days ago",
    progress: "6/8 topics",
  },
  {
    id: "sec-lr-reg",
    title: "Linear vs Logistic Regression",
    source: "Website",
    updatedAt: "4 days ago",
    progress: "3/6 topics",
  },
  {
    id: "sec-feature-eng",
    title: "Feature Engineering Essentials",
    source: "Custom Note",
    updatedAt: "5 days ago",
    progress: "5/9 topics",
  },
  {
    id: "sec-model-eval",
    title: "Model Evaluation Metrics",
    source: "PDF",
    updatedAt: "1 week ago",
    progress: "7/10 topics",
  },
  {
    id: "sec-overfit-underfit",
    title: "Overfitting and Underfitting",
    source: "Youtube",
    updatedAt: "1 week ago",
    progress: "2/4 topics",
  },
  {
    id: "sec-data-cleaning",
    title: "Data Cleaning Workflow",
    source: "Word",
    updatedAt: "8 days ago",
    progress: "4/6 topics",
  },
  {
    id: "sec-tree-ensembles",
    title: "Decision Trees and Ensembles",
    source: "PowerPoint",
    updatedAt: "2 weeks ago",
    progress: "3/7 topics",
  },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [studyTitle, setStudyTitle] = useState("Study Title");
  const [selectedSource, setSelectedSource] = useState<string>("PDF");
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [customNote, setCustomNote] = useState("");
  const isLinkSource = LINK_SOURCE_OPTIONS.includes(
    selectedSource as (typeof LINK_SOURCE_OPTIONS)[number]
  );
  const isCustomNote = selectedSource === "Custom Note";

  const canContinue = useMemo(() => {
    if (!studyTitle.trim()) return false;
    if (isLinkSource) return sourceUrl.trim().length > 0;
    if (isCustomNote) return customNote.trim().length > 0;
    return uploadedFileName.trim().length > 0;
  }, [
    customNote,
    isCustomNote,
    isLinkSource,
    sourceUrl,
    studyTitle,
    uploadedFileName,
  ]);

  const handleContinue = () => {
    if (!canContinue) return;
    const params = new URLSearchParams({
      tab: "study",
      source: selectedSource,
      title: studyTitle.trim(),
    });
    if (isLinkSource) params.set("sourceUrl", sourceUrl.trim());
    if (isCustomNote) params.set("note", customNote.trim());
    if (!isLinkSource && !isCustomNote) params.set("file", uploadedFileName);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopHeader />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">New Study Source</h1>
            <p className="text-sm text-muted-foreground">
              Choose one source type, then continue to the study workspace.
            </p>
          </header>

          <section className="space-y-6 rounded-xl border bg-card p-6">
            <div className="space-y-2">
              <label
                htmlFor="study-title"
                className="text-sm font-medium text-foreground"
              >
                Title:
              </label>
              <input
                id="study-title"
                value={studyTitle}
                onChange={(event) => setStudyTitle(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background transition-[border,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Study Title"
              />
            </div>

            <div className={cn("space-y-2", LINKS_DISABLED && "opacity-60")}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="text-sm font-medium text-foreground">Links:</h2>
                {LINKS_DISABLED && (
                  <span className="text-xs text-muted-foreground">
                    Not available yet
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {LINK_SOURCE_OPTIONS.map((option) => {
                  const selected = selectedSource === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={LINKS_DISABLED}
                      aria-pressed={selected}
                      aria-disabled={LINKS_DISABLED}
                      onClick={() => {
                        setSelectedSource(option);
                        setUploadedFileName("");
                        setCustomNote("");
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        LINKS_DISABLED &&
                          "cursor-not-allowed opacity-50 hover:border-border hover:text-muted-foreground",
                        !LINKS_DISABLED &&
                          (selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-foreground">Files:</h2>
              <div className="flex flex-wrap gap-2">
                {FILE_SOURCE_OPTIONS.map((option) => {
                  const selected = selectedSource === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setSelectedSource(option);
                        setSourceUrl("");
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {isLinkSource && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Source URL:
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://example.com"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background transition-[border,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            )}

            {!isLinkSource && !isCustomNote && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Upload file:
                </label>
                <input
                  type="file"
                  onChange={(event) =>
                    setUploadedFileName(event.target.files?.[0]?.name ?? "")
                  }
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
                {uploadedFileName && (
                  <p className="text-xs text-muted-foreground">
                    Selected file: {uploadedFileName}
                  </p>
                )}
              </div>
            )}

            {isCustomNote && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Custom note:
                </label>
                <textarea
                  value={customNote}
                  onChange={(event) => setCustomNote(event.target.value)}
                  placeholder="Write your note here..."
                  rows={5}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-[border,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Selected source: {selectedSource}
            </p>
          </section>

          <div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Study Workspace
            </button>
          </div>

          <section className="space-y-4 rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Recent Study Sections
              </h2>
              <span className="text-xs text-muted-foreground">Demo</span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {DEMO_RECENT_SECTIONS.map((section) => (
                <article
                  key={section.id}
                  className="rounded-lg border bg-background p-4"
                >
                  <p className="text-sm font-medium text-foreground">
                    {section.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {section.updatedAt}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      {section.source}
                    </span>
                    <span className="text-muted-foreground">
                      {section.progress}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
