import { Bold, Hash, Italic, List, ListOrdered, Underline } from "lucide-react";
import { useRef } from "react";

import { MarkdownRenderer } from "./MarkdownRenderer";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

type ToolbarAction = "bold" | "italic" | "underline" | "heading" | "bullet" | "numbered";

function withSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after = before,
) {
  const selected = value.slice(start, end) || "текст";
  const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  return {
    nextValue,
    selectionStart: start + before.length,
    selectionEnd: start + before.length + selected.length,
  };
}

function prefixSelectedLines(
  value: string,
  start: number,
  end: number,
  getPrefix: (lineIndex: number) => string,
) {
  const blockStart = value.lastIndexOf("\n", start - 1) + 1;
  const blockEndIndex = value.indexOf("\n", end);
  const blockEnd = blockEndIndex === -1 ? value.length : blockEndIndex;
  const selectedBlock = value.slice(blockStart, blockEnd);
  const lines = selectedBlock.split("\n");
  const prefixed = lines.map((line, index) => `${getPrefix(index)}${line}`).join("\n");
  return {
    nextValue: `${value.slice(0, blockStart)}${prefixed}${value.slice(blockEnd)}`,
    selectionStart: blockStart,
    selectionEnd: blockStart + prefixed.length,
  };
}

export function MarkdownEditor({
  value,
  onChange,
  rows = 12,
  placeholder = "Содержание (Markdown)",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let result:
      | {
          nextValue: string;
          selectionStart: number;
          selectionEnd: number;
        }
      | undefined;

    switch (action) {
      case "bold":
        result = withSelection(value, start, end, "**");
        break;
      case "italic":
        result = withSelection(value, start, end, "*");
        break;
      case "underline":
        result = withSelection(value, start, end, "++");
        break;
      case "heading":
        result = prefixSelectedLines(value, start, end, () => "## ");
        break;
      case "bullet":
        result = prefixSelectedLines(value, start, end, () => "- ");
        break;
      case "numbered":
        result = prefixSelectedLines(value, start, end, (lineIndex) => `${lineIndex + 1}. `);
        break;
    }

    if (!result) return;

    onChange(result.nextValue);
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 p-2">
        <ToolbarButton label="Жирный" onClick={() => applyAction("bold")} icon={<Bold size={14} />} />
        <ToolbarButton label="Курсив" onClick={() => applyAction("italic")} icon={<Italic size={14} />} />
        <ToolbarButton label="Подчеркнуть" onClick={() => applyAction("underline")} icon={<Underline size={14} />} />
        <ToolbarButton label="Заголовок" onClick={() => applyAction("heading")} icon={<Hash size={14} />} />
        <ToolbarButton label="Список" onClick={() => applyAction("bullet")} icon={<List size={14} />} />
        <ToolbarButton
          label="Нумерация"
          onClick={() => applyAction("numbered")}
          icon={<ListOrdered size={14} />}
        />
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="min-h-[220px] w-full resize-y rounded-b-xl px-3 py-3 font-mono text-sm leading-6 text-slate-800 outline-none sm:px-4"
      />

      <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Предпросмотр</p>
        <div className="rounded-lg bg-white p-3 sm:p-4">
          <MarkdownRenderer
            content={value}
            emptyFallback={<p className="text-sm text-slate-400">Введите текст, чтобы увидеть предпросмотр.</p>}
          />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: JSX.Element;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 max-sm:flex-1"
    >
      {icon}
      {label}
    </button>
  );
}
