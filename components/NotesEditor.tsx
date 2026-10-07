"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { createCardsFromNote, saveNotes } from "@/app/actions";

type DeckOption = { id: string; title: string };
type CardDraft = { front: string; back: string };

export default function NotesEditor({
  noteId,
  initialContent,
  decks,
}: {
  noteId: string;
  initialContent: string;
  decks: DeckOption[];
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [deckId, setDeckId] = useState(decks[0]?.id ?? "");
  const [cardDrafts, setCardDrafts] = useState<CardDraft[]>([]);
  const [omittedCards, setOmittedCards] = useState(0);
  const [overlongLines, setOverlongLines] = useState(0);
  const [searchedForCards, setSearchedForCards] = useState(false);

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
      setCardDrafts([]);
      setOmittedCards(0);
      setOverlongLines(0);
      setSearchedForCards(false);
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

  function prepareCards() {
    if (!editor) return;
    let overlong = 0;
    const matches = editor.getText({ blockSeparator: "\n" }).split("\n").flatMap((line) => {
      const separator = line.indexOf("::");
      if (separator < 1) return [];
      const front = line.slice(0, separator).trim();
      const back = line.slice(separator + 2).trim();
      if (front.length > 1000 || back.length > 1000) {
        overlong += 1;
        return [];
      }
      return front && back ? [{ front, back }] : [];
    });
    setCardDrafts(matches.slice(0, 50));
    setOmittedCards(Math.max(0, matches.length - 50));
    setOverlongLines(overlong);
    setSearchedForCards(true);
  }

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
      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4" aria-labelledby="note-cards-heading">
        <div>
          <h2 id="note-cards-heading" className="font-medium">Turn note lines into flashcards</h2>
          <p className="mt-1 text-sm text-stone-500">Write one card per line using <code>term :: definition</code>, then choose a deck.</p>
        </div>
        {decks.length ? (
          <form action={createCardsFromNote} className="space-y-3">
            <input type="hidden" name="note_id" value={noteId} />
            <input type="hidden" name="cards_json" value={JSON.stringify(cardDrafts)} />
            <label className="grid max-w-md gap-1 text-sm">
              <span>Destination deck</span>
              <select name="deck_id" value={deckId} onChange={(event) => setDeckId(event.target.value)} required className="rounded-lg border border-stone-300 bg-white px-3 py-2">
                {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.title}</option>)}
              </select>
            </label>
            <button type="button" onClick={prepareCards} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-100">
              Find card lines
            </button>
            {cardDrafts.length > 0 && (
              <div className="space-y-2" role="status">
                <p className="text-sm text-stone-600">Found {cardDrafts.length} card {cardDrafts.length === 1 ? "line" : "lines"}.{omittedCards > 0 ? ` ${omittedCards} more were left out; the 50-card limit means you can move some lines into a separate note.` : ""}</p>
                <ul className="space-y-1 text-sm text-stone-500">
                  {cardDrafts.slice(0, 3).map((card, index) => <li key={`${index}-${card.front}`}><strong>{card.front}</strong> → {card.back}</li>)}
                </ul>
                <button type="submit" className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900">
                  Create {cardDrafts.length} {cardDrafts.length === 1 ? "card" : "cards"}
                </button>
              </div>
            )}
            {searchedForCards && cardDrafts.length === 0 && <p className="text-sm text-stone-600" role="status">No card lines found. Use <code>term :: definition</code> on each line.</p>}
            {overlongLines > 0 && <p className="text-sm text-amber-700" role="status">Skipped {overlongLines} card {overlongLines === 1 ? "line" : "lines"} because a side exceeded 1,000 characters.</p>}
          </form>
        ) : (
          <p className="text-sm text-stone-500">Create a deck first, then come back to turn note lines into cards.</p>
        )}
      </section>
      <p aria-live="polite" className="text-xs text-stone-400">{saveStatus}</p>
    </div>
  );
}
