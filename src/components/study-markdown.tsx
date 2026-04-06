"use client";

import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

/** Convert LaTeX-style delimiters in source notes to $ / $$ for remark-math */
export function preprocessStudyMarkdown(md: string): string {
  let s = md;
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, body: string) => `\n\n$$\n${body.trim()}\n$$\n\n`);
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, body: string) => `$${body.trim()}$`);
  return s;
}

const studyComponents: Components = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-6 mb-3 text-xl font-bold text-foreground first:mt-0",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-5 mb-3 text-lg font-bold text-foreground first:mt-0",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-5 mb-2 text-base font-semibold text-foreground first:mt-0",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "mt-4 mb-2 text-sm font-semibold text-foreground first:mt-0",
        className
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("mb-3 text-sm leading-relaxed text-foreground/85 last:mb-0", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/85", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-3 list-decimal space-y-1.5 pl-5 text-sm text-foreground/85", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-4 border-l-4 border-primary/30 pl-4 text-sm italic text-muted-foreground",
        className
      )}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("font-medium text-primary underline underline-offset-2 hover:text-primary/80", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-6 border-border", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="my-4 w-full overflow-x-auto">
      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <table
          className={cn(
            "w-full min-w-[20rem] border-collapse border-spacing-0 text-sm",
            className
          )}
          {...props}
        />
      </div>
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn("bg-muted/60", className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border-b border-r border-border px-3 py-2 text-left font-semibold text-foreground last:border-r-0",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "border-b border-r border-border px-3 py-2 align-top text-foreground/90 last:border-r-0",
        className
      )}
      {...props}
    />
  ),
  tbody: ({ className, ...props }) => (
    <tbody
      className={cn("[&>tr:last-child>td]:border-b-0", className)}
      {...props}
    />
  ),
  tr: ({ className, ...props }) => (
    <tr className={cn("even:bg-muted/15", className)} {...props} />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-4 overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-sm",
        className
      )}
      {...props}
    />
  ),
  code({ className, children, ...props }) {
    const isBlock = /language-[\w-]+/.test(className ?? "");
    if (!isBlock) {
      return (
        <code
          className={cn(
            "rounded-md bg-muted/90 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn("block font-mono text-sm leading-relaxed text-foreground", className)} {...props}>
        {children}
      </code>
    );
  },
};

interface StudyMarkdownProps {
  content: string;
  className?: string;
}

export function StudyMarkdown({ content, className }: StudyMarkdownProps) {
  const processed = preprocessStudyMarkdown(content);

  return (
    <div
      className={cn(
        "study-markdown prose-sm max-w-none [&_.katex]:text-foreground [&_.katex-display]:my-4",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={studyComponents}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
