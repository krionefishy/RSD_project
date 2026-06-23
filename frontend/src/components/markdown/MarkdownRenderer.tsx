import type { ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  emptyFallback?: ReactNode;
}

interface ListItemNode {
  text: string;
  checked: boolean | null;
  children: ListNode[];
}

interface ListNode {
  ordered: boolean;
  items: ListItemNode[];
}

type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; list: ListNode }
  | { type: "quote"; blocks: Block[] }
  | { type: "code"; language: string | null; content: string }
  | { type: "table"; headers: string[]; rows: string[][] };

function normalizeLines(content: string): string[] {
  return content.replace(/\r\n/g, "\n").replace(/\t/g, "  ").split("\n");
}

function leadingSpaces(value: string): number {
  return value.match(/^ */)?.[0].length ?? 0;
}

function matchListLine(line: string): {
  indent: number;
  ordered: boolean;
  checked: boolean | null;
  text: string;
} | null {
  const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(?:\[( |x|X)\]\s+)?(.*)$/);
  if (!match) return null;
  return {
    indent: match[1].length,
    ordered: /\d+\./.test(match[2]),
    checked: match[3] === undefined ? null : match[3].toLowerCase() === "x",
    text: match[4],
  };
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);
}

function parseTableRow(line: string): string[] {
  const normalized = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return normalized.split("|").map((cell) => cell.trim());
}

function parseList(lines: string[], start: number, baseIndent: number): { list: ListNode; nextIndex: number } {
  const first = matchListLine(lines[start]);
  if (!first) {
    return { list: { ordered: false, items: [] }, nextIndex: start };
  }

  const list: ListNode = { ordered: first.ordered, items: [] };
  let index = start;

  while (index < lines.length) {
    const currentMatch = matchListLine(lines[index]);
    if (!currentMatch || currentMatch.indent < baseIndent) {
      break;
    }

    if (currentMatch.indent > baseIndent) {
      if (list.items.length === 0) break;
      const nested = parseList(lines, index, currentMatch.indent);
      list.items[list.items.length - 1].children.push(nested.list);
      index = nested.nextIndex;
      continue;
    }

    if (currentMatch.ordered !== list.ordered) {
      break;
    }

    const item: ListItemNode = {
      text: currentMatch.text,
      checked: currentMatch.checked,
      children: [],
    };
    list.items.push(item);
    index += 1;

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        break;
      }

      const nextListMatch = matchListLine(line);
      if (nextListMatch) {
        if (nextListMatch.indent > baseIndent) {
          const nested = parseList(lines, index, nextListMatch.indent);
          item.children.push(nested.list);
          index = nested.nextIndex;
          continue;
        }
        break;
      }

      if (leadingSpaces(line) > baseIndent) {
        item.text += `\n${line.trim()}`;
        index += 1;
        continue;
      }
      break;
    }
  }

  return { list, nextIndex: index };
}

function parseBlocks(content: string): Block[] {
  const lines = normalizeLines(content);
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const codeFence = trimmed.match(/^```([\w-]+)?\s*$/);
    if (codeFence) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({
        type: "code",
        language: codeFence[1] ?? null,
        content: codeLines.join("\n"),
      });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        content: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", blocks: parseBlocks(quoteLines.join("\n")) });
      continue;
    }

    const listMatch = matchListLine(line);
    if (listMatch) {
      const parsed = parseList(lines, index, listMatch.indent);
      blocks.push({ type: "list", list: parsed.list });
      index = parsed.nextIndex;
      continue;
    }

    if (index + 1 < lines.length && trimmed.includes("|") && isTableSeparator(lines[index + 1].trim())) {
      const headers = parseTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().includes("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index];
      const currentTrimmed = current.trim();
      if (!currentTrimmed) break;
      if (
        currentTrimmed.startsWith("```") ||
        /^(#{1,6})\s+/.test(currentTrimmed) ||
        /^\s*>/.test(current) ||
        matchListLine(current) ||
        (index + 1 < lines.length &&
          currentTrimmed.includes("|") &&
          isTableSeparator(lines[index + 1].trim()))
      ) {
        break;
      }
      paragraph.push(current);
      index += 1;
    }
    blocks.push({ type: "paragraph", content: paragraph.join("\n") });
  }

  return blocks;
}

function renderInline(text: string, keyPrefix = "inline"): ReactNode[] {
  const normalized = text.replace(/<u>(.*?)<\/u>/g, "++$1++");
  const pattern =
    /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*\*[^*]+?\*\*\*|___[^_]+?___|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*]+?\*|_[^_]+?_|(?:\+\+[^+]+?\+\+))/g;
  const parts = normalized.split(pattern).filter(Boolean);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2"
        >
          {renderInline(label, `${key}-label`)}
        </a>
      );
    }

    if ((part.startsWith("***") && part.endsWith("***")) || (part.startsWith("___") && part.endsWith("___"))) {
      return (
        <strong key={key}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      );
    }

    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("++") && part.endsWith("++")) {
      return (
        <span key={key} className="underline decoration-slate-500 underline-offset-2">
          {part.slice(2, -2)}
        </span>
      );
    }

    return part;
  });
}

function renderTextWithBreaks(text: string, keyPrefix: string): ReactNode[] {
  return text.split("\n").flatMap((line, index, lines) => {
    const nodes: ReactNode[] = [<span key={`${keyPrefix}-line-${index}`}>{renderInline(line, `${keyPrefix}-${index}`)}</span>];
    if (index < lines.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${index}`} />);
    }
    return nodes;
  });
}

function renderList(list: ListNode, keyPrefix: string): ReactNode {
  const hasChecklist = list.items.some((item) => item.checked !== null);
  const ListTag = list.ordered && !hasChecklist ? "ol" : "ul";
  const listClassName = hasChecklist
    ? "space-y-2"
    : list.ordered
      ? "list-decimal space-y-2 pl-5"
      : "list-disc space-y-2 pl-5";

  return (
    <ListTag key={keyPrefix} className={`${listClassName} text-sm leading-6 text-slate-700`}>
      {list.items.map((item, index) => (
        <li key={`${keyPrefix}-item-${index}`} className={hasChecklist ? "list-none" : undefined}>
          {item.checked !== null ? (
            <div className="flex items-start gap-2">
              <span
                className={`mt-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                  item.checked
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-400 bg-white text-transparent"
                }`}
              >
                ✓
              </span>
              <div className="min-w-0 flex-1">{renderTextWithBreaks(item.text, `${keyPrefix}-item-${index}`)}</div>
            </div>
          ) : (
            renderTextWithBreaks(item.text, `${keyPrefix}-item-${index}`)
          )}
          {item.children.length > 0 && (
            <div className="mt-2 pl-2">
              {item.children.map((child, childIndex) => renderList(child, `${keyPrefix}-child-${index}-${childIndex}`))}
            </div>
          )}
        </li>
      ))}
    </ListTag>
  );
}

function renderBlocks(blocks: Block[], keyPrefix = "block"): ReactNode[] {
  return blocks.map((block, index) => {
    const key = `${keyPrefix}-${index}`;

    if (block.type === "heading") {
      if (block.level === 1) {
        return (
          <h1 key={key} className="text-2xl font-bold text-slate-900">
            {renderInline(block.content, key)}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2 key={key} className="text-xl font-bold text-slate-900">
            {renderInline(block.content, key)}
          </h2>
        );
      }
      if (block.level === 3) {
        return (
          <h3 key={key} className="text-base font-semibold text-slate-900">
            {renderInline(block.content, key)}
          </h3>
        );
      }
      if (block.level === 4) {
        return (
          <h4 key={key} className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            {renderInline(block.content, key)}
          </h4>
        );
      }
      return (
        <h5 key={key} className="text-sm font-medium text-slate-900">
          {renderInline(block.content, key)}
        </h5>
      );
    }

    if (block.type === "paragraph") {
      return (
        <p key={key} className="text-sm leading-6 text-slate-700">
          {renderTextWithBreaks(block.content, key)}
        </p>
      );
    }

    if (block.type === "list") {
      return renderList(block.list, key);
    }

    if (block.type === "quote") {
      return (
        <blockquote key={key} className="rounded-r-lg border-l-4 border-slate-300 bg-slate-50 px-4 py-3">
          <div className="space-y-3">{renderBlocks(block.blocks, `${key}-quote`)}</div>
        </blockquote>
      );
    }

    if (block.type === "code") {
      return (
        <div key={key} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
          {block.language && (
            <div className="border-b border-slate-800 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {block.language}
            </div>
          )}
          <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-100">
            <code>{block.content}</code>
          </pre>
        </div>
      );
    }

    return (
      <div key={key} className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="bg-slate-50">
            <tr>
              {block.headers.map((header, headerIndex) => (
                <th key={`${key}-header-${headerIndex}`} className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-900">
                  {renderInline(header, `${key}-header-${headerIndex}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`${key}-row-${rowIndex}`} className="border-b border-slate-100 last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td key={`${key}-cell-${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top">
                    {renderTextWithBreaks(cell, `${key}-cell-${rowIndex}-${cellIndex}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  });
}

export function MarkdownRenderer({
  content,
  className,
  emptyFallback = <p className="text-sm text-slate-500">Контент пока не добавлен.</p>,
}: MarkdownRendererProps) {
  if (!content.trim()) {
    return <>{emptyFallback}</>;
  }

  const blocks = parseBlocks(content);

  return <div className={className ?? "space-y-4"}>{renderBlocks(blocks)}</div>;
}
