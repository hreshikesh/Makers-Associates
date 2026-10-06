/**
 * RichTextEditor — TipTap-based WYSIWYG editor.
 *
 * Emits HTML via `onChange(html)` so it drops straight into existing
 * content_html / description / terms style fields.
 *
 * Usage:
 *   <RichTextEditor value={html} onChange={setHtml} placeholder="Write..." />
 */
import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Undo2, Redo2, Strikethrough, Code2, Minus,
} from "lucide-react";

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing…",
  minHeight = 200,
  className = "",
  "data-testid": testId,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-brand-orange underline hover:text-brand-orange/80" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: `max-w-none focus:outline-none px-4 py-3 text-brand-navy leading-relaxed text-sm`,
        style: `min-height: ${minHeight}px;`,
        "data-testid": testId || "rte-content",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // TipTap emits "<p></p>" when empty — normalise to empty string
      onChange?.(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes into the editor without breaking cursor
  const lastValue = useRef(value);
  useEffect(() => {
    if (!editor) return;
    if (value !== lastValue.current && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
      lastValue.current = value;
    }
  }, [value, editor]);

  useEffect(() => () => editor?.destroy(), [editor]);

  if (!editor) {
    return (
      <div
        className={`rounded-xl border border-black/10 bg-white ${className}`}
        style={{ minHeight }}
      />
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL (leave empty to remove)", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className={`rounded-xl border border-black/10 bg-white overflow-hidden ${className}`}>
      <div
        className="flex flex-wrap items-center gap-1 border-b border-black/5 px-2 py-1.5 bg-brand-bg/50"
        data-testid={`${testId || "rte"}-toolbar`}
      >
        <TB
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="Bold (Ctrl+B)"
          testId="rte-bold"
        >
          <Bold className="w-4 h-4" />
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="Italic (Ctrl+I)"
          testId="rte-italic"
        >
          <Italic className="w-4 h-4" />
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          label="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </TB>
        <div className="w-px h-5 bg-black/10 mx-1" />
        <TB
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          label="Heading 1"
          testId="rte-h1"
        >
          <Heading1 className="w-4 h-4" />
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          label="Heading 2"
          testId="rte-h2"
        >
          <Heading2 className="w-4 h-4" />
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          label="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </TB>
        <div className="w-px h-5 bg-black/10 mx-1" />
        <TB
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label="Bullet List"
          testId="rte-bullet"
        >
          <List className="w-4 h-4" />
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          label="Quote"
        >
          <Quote className="w-4 h-4" />
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          label="Code Block"
        >
          <Code2 className="w-4 h-4" />
        </TB>
        <TB
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label="Divider"
        >
          <Minus className="w-4 h-4" />
        </TB>
        <div className="w-px h-5 bg-black/10 mx-1" />
        <TB onClick={setLink} active={editor.isActive("link")} label="Link" testId="rte-link">
          <LinkIcon className="w-4 h-4" />
        </TB>
        <div className="ml-auto flex items-center gap-1">
          <TB
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </TB>
          <TB
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </TB>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function TB({ onClick, active, disabled, label, children, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      data-testid={testId}
      className={`w-8 h-8 rounded-md grid place-items-center transition ${
        active
          ? "bg-brand-orange text-white"
          : "text-brand-navy/70 hover:bg-white hover:text-brand-navy disabled:opacity-40"
      }`}
    >
      {children}
    </button>
  );
}
