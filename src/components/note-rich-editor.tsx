"use client";

import { useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { List, ListOrdered, Quote, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
  onClick,
  active,
  children,
  title,
  className,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
        active && "bg-foreground/10 text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden />;
}

export interface NoteRichEditorProps {
  initialHtml?: string;
  onChange?: (html: string) => void;
  className?: string;
}

export function NoteRichEditor({
  initialHtml = "",
  onChange,
  className,
}: NoteRichEditorProps) {
  // Stable references — a new array every render makes TipTap re-apply options constantly
  // and can leave `useEditor` stuck on `null` in Next.js + React 18/19 strict mode.
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        bulletList: { HTMLAttributes: { class: "list-disc pl-5" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-5" } },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Start typing your notes here…",
      }),
    ],
    []
  );

  const editor = useEditor({
    immediatelyRender: true,
    extensions,
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          "min-h-[260px] max-w-none px-4 py-4 text-sm leading-relaxed text-foreground/90 outline-none",
      },
    },
    onCreate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
  });

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-white shadow-sm",
          className
        )}
      >
        <div className="h-10 border-b bg-muted/50" />
        <div className="h-[280px] animate-pulse bg-muted/20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-white shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 px-2 py-1.5 font-mono text-xs">
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <span className="flex items-center gap-1">
            <List className="h-3.5 w-3.5" />
            List
          </span>
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <span className="flex items-center gap-1">
            <ListOrdered className="h-3.5 w-3.5" />
            List
          </span>
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <span className="flex items-center gap-1">
            <Quote className="h-3.5 w-3.5" />
            Quote
          </span>
        </ToolbarButton>
        <ToolbarButton
          title="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <span className="flex items-center gap-1">
            <Terminal className="h-3.5 w-3.5" />
            Code
          </span>
        </ToolbarButton>
      </div>

      <div
        className={cn(
          "note-rich-editor bg-white",
          "[&_.ProseMirror]:min-h-[260px]",
          "[&_p]:mb-3 [&_p:has(+ul)]:mb-2",
          "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold",
          "[&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold",
          "[&_ul]:my-2 [&_ul]:space-y-1",
          "[&_ol]:my-2 [&_ol]:space-y-1",
          "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/25 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
          "[&_li>p]:mb-0"
        )}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
