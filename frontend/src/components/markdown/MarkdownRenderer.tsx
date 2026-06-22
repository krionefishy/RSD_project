import type { ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  emptyFallback?: ReactNode;
}

type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; content: string }
  | { type: "paragraph"; content: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
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

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        const match = current.match(/^[-*]\s+(.*)$/);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        const match = current.match(/^\d+\.\s+(.*)$/);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (!current) break;
      if (/^(#{1,6})\s+/.test(current) || /^[-*]\s+/.test(current) || /^\d+\.\s+/.test(current)) {
        break;
      }
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", content: paragraph.join("\n") });
  }

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const normalized = text.replace(/<u>(.*?)<\/u>/g, "++$1++");
  const pattern =
    /(\*\*\*[^*]+?\*\*\*|___[^_]+?___|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*]+?\*|_[^_]+?_|\+\+[^+]+?\+\+)/g;
  const parts = normalized.split(pattern).filter(Boolean);

  return parts.map((part, index) => {
    if ((part.startsWith("***") && part.endsWith("***")) || (part.startsWith("___") && part.endsWith("___"))) {
      const value = part.slice(3, -3);
      return (
        <strong key={index}>
          <em>{value}</em>
        </strong>
      );
    }
    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("++") && part.endsWith("++")) {
      return (
        <span key={index} className="underline">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

function renderTextWithBreaks(text: string): ReactNode[] {
  return text.split("\n").flatMap((line, index, lines) => {
    const nodes: ReactNode[] = [<span key={`line-${index}`}>{renderInline(line)}</span>];
    if (index < lines.length - 1) {
      nodes.push(<br key={`br-${index}`} />);
    }
    return nodes;
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

  return (
    <div className={className ?? "space-y-4"}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          if (block.level === 1) {
            return (
              <h1 key={index} className="text-2xl font-bold text-slate-900">
                {renderInline(block.content)}
              </h1>
            );
          }
          if (block.level === 2) {
            return (
              <h2 key={index} className="text-xl font-bold text-slate-900">
                {renderInline(block.content)}
              </h2>
            );
          }
          if (block.level === 3) {
            return (
              <h3 key={index} className="text-base font-semibold text-slate-900">
                {renderInline(block.content)}
              </h3>
            );
          }
          if (block.level === 4) {
            return (
              <h4 key={index} className="text-sm font-semibold text-slate-900">
                {renderInline(block.content)}
              </h4>
            );
          }
          return (
            <h5 key={index} className="text-sm font-medium text-slate-900">
              {renderInline(block.content)}
            </h5>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderTextWithBreaks(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={index} className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderTextWithBreaks(item)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={index} className="text-sm leading-6 text-slate-700">
            {renderTextWithBreaks(block.content)}
          </p>
        );
      })}
    </div>
  );
}
