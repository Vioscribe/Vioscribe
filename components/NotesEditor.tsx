"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { saveNotes } from "@/app/actions";

export default function NotesEditor({ initialContent }: { initialContent: string }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      timer.current = setTimeout(() => {
        void saveNotes(html);
      }, 800);
    },
  });

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!editor) return <p className="text-sm text-stone-400">Loading editor…</p>;

  return (
    <div className="notes-editor space-y-3">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="rounded border border-stone-300 px-2 py-1 hover:bg-white"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="rounded border border-stone-300 px-2 py-1 hover:bg-white"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="rounded border border-stone-300 px-2 py-1 hover:bg-white"
        >
          Bullets
        </button>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <EditorContent editor={editor} />
      </div>
      <p className="text-xs text-stone-400">Autosaves a moment after you stop typing.</p>
    </div>
  );
}
