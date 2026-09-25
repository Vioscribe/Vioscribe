import { moveDeckToFile, moveNoteToFile } from "@/app/actions";

type FilingItem = {
  id: string;
  file_id: string | null;
};

export default function FileItemMoveForm({
  item,
  kind,
  files,
  returnTo,
  targetFileId,
}: {
  item: FilingItem;
  kind: "note" | "deck";
  files: { id: string; title: string }[];
  returnTo: string;
  targetFileId?: string;
}) {
  const action = kind === "note" ? moveNoteToFile : moveDeckToFile;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name={kind === "note" ? "note_id" : "deck_id"} value={item.id} />
      <input type="hidden" name="return_to" value={returnTo} />
      <label className="sr-only" htmlFor={`${kind}-file-${item.id}`}>File this {kind}</label>
      <select
        id={`${kind}-file-${item.id}`}
        name="file_id"
        defaultValue={targetFileId ?? item.file_id ?? ""}
        className="max-w-52 rounded border border-stone-300 bg-stone-50 px-2 py-1 text-xs text-stone-900"
      >
        <option value="">Unfiled</option>
        {files.map((file) => <option key={file.id} value={file.id}>{file.title}</option>)}
      </select>
      <button type="submit" className="text-xs font-semibold text-orange-300 hover:text-yellow-200">
        Move
      </button>
    </form>
  );
}
