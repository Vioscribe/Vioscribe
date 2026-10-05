"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { saveNotes } from "@/app/actions";

export default function NotesEditor({
  noteId,
  initialContent,
}: {
  noteId: string;
  initialContent: string;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState("Saved");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: {
        class: "min-h-80",
      },
    },
    onUpdate: ({ editor }) => {
      if (timer.current) clearTimeout(timer.current);
      const html = editor.getHTML();
      setSaveStatus("Unsaved changes");
      timer.current = setTimeout(async () => {
        const saved = await saveNotes(noteId, html);
        setSaveStatus(saved ? "Saved" : "Could not save. Check your connection.");
      }, 800);
    },
  });

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        if (editor) void saveNotes(noteId, editor.getHTML());
      }
    };
  }, [editor, noteId]);

  if (!editor) return <p className="text-sm text-stone-400">Loading editor…</p>;

  return (
    <div className="notes-editor space-y-3">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-pressed={editor.isActive("heading", { level: 1 })}
          className={"rounded border border-stone-300 px-2 py-1 hover:bg-white " + (editor.isActive("heading", { level: 1 }) ? "bg-amber-100" : "")}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-pressed={editor.isActive("heading", { level: 2 })}
          className={"rounded border border-stone-300 px-2 py-1 hover:bg-white " + (editor.isActive("heading", { level: 2 }) ? "bg-amber-100" : "")}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-pressed={editor.isActive("bulletList")}
          className={"rounded border border-stone-300 px-2 py-1 hover:bg-white " + (editor.isActive("bulletList") ? "bg-amber-100" : "")}
        >
          Bullets
        </button>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <EditorContent editor={editor} />
      </div>
      <p aria-live="polite" className="text-xs text-stone-400">{saveStatus}</p>
    </div>
  );
}
