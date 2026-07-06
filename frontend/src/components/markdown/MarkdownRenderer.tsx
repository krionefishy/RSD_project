import type { Components } from "react-markdown";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

import { parseAttachmentId, preprocessLegacyMarkdown, transformMarkdownUrl } from "./markdownUtils";
import { markdownSanitizeSchema } from "./rehypeSanitizeSchema";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  emptyFallback?: ReactNode;
  attachmentUrls?: Record<number, string>;
}

function AttachmentImage({
  attachmentId,
  alt,
  url,
}: {
  attachmentId: number;
  alt: string;
  url: string | undefined;
}) {
  if (!url) {
    return (
      <figure className="my-4 block">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Изображение недоступно (вложение #{attachmentId})
        </div>
      </figure>
    );
  }

  return (
    <figure className="my-4 block">
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img
          src={url}
          alt={alt || `Вложение ${attachmentId}`}
          className="block w-full max-w-full rounded-xl object-contain"
          style={{ maxHeight: 480 }}
        />
      </a>
      {alt.trim() ? (
        <figcaption className="mt-2 text-center text-xs text-slate-500">{alt}</figcaption>
      ) : null}
    </figure>
  );
}

function createComponents(attachmentUrls: Record<number, string>): Components {
  return {
    h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold text-slate-900">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-slate-900">{children}</h3>,
    h4: ({ children }) => (
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900">{children}</h4>
    ),
    h5: ({ children }) => <h5 className="text-sm font-medium text-slate-900">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-medium text-slate-900">{children}</h6>,
    p: ({ children }) => <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{children}</p>,
    ul: ({ children, className }) => (
      <ul
        className={
          className?.includes("contains-task-list")
            ? "space-y-2 text-sm leading-6 text-slate-700"
            : "list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700"
        }
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">{children}</ol>
    ),
    li: ({ children, className }) => (
      <li
        className={
          className?.includes("task-list-item")
            ? "list-none whitespace-pre-line"
            : "whitespace-pre-line"
        }
      >
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="rounded-r-lg border-l-4 border-slate-300 bg-slate-50 px-4 py-3">
        <div className="space-y-3">{children}</div>
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2"
      >
        {children}
      </a>
    ),
    code: ({ className, children }) => {
      const languageMatch = /language-([\w-]+)/.exec(className ?? "");
      if (languageMatch) {
        return <code>{children}</code>;
      }
      return (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800">
          {children}
        </code>
      );
    },
    pre: ({ children }) => {
      const codeElement = Array.isArray(children) ? children[0] : children;
      const language =
        typeof codeElement === "object" &&
        codeElement !== null &&
        "props" in codeElement &&
        typeof codeElement.props.className === "string"
          ? /language-([\w-]+)/.exec(codeElement.props.className)?.[1] ?? null
          : null;

      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
          {language ? (
            <div className="border-b border-slate-800 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {language}
            </div>
          ) : null}
          <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-100">{children}</pre>
        </div>
      );
    },
    table: ({ children }) => (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-left text-sm text-slate-700">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
    th: ({ children }) => (
      <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-900">{children}</th>
    ),
    td: ({ children }) => (
      <td className="whitespace-pre-line border-b border-slate-100 px-3 py-2 align-top">{children}</td>
    ),
    tr: ({ children }) => <tr className="border-b border-slate-100 last:border-b-0">{children}</tr>,
    input: ({ type, checked }) => {
      if (type !== "checkbox") return null;
      return (
        <span
          aria-hidden
          className={`mr-2 mt-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
            checked
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-400 bg-white text-transparent"
          }`}
        >
          ✓
        </span>
      );
    },
    u: ({ children }) => (
      <span className="underline decoration-slate-500 underline-offset-2">{children}</span>
    ),
    img: ({ src, alt }) => {
      const srcValue = typeof src === "string" ? src : "";
      const attachmentId = parseAttachmentId(srcValue);
      if (attachmentId !== null) {
        return (
          <AttachmentImage
            attachmentId={attachmentId}
            alt={alt ?? ""}
            url={attachmentUrls[attachmentId]}
          />
        );
      }

      if (typeof src !== "string" || !srcValue) {
        return null;
      }

      return (
        <figure className="my-4 block">
          <img
            src={srcValue}
            alt={alt ?? ""}
            className="block w-full max-w-full rounded-xl object-contain"
            style={{ maxHeight: 480 }}
          />
          {alt?.trim() ? (
            <figcaption className="mt-2 text-center text-xs text-slate-500">{alt}</figcaption>
          ) : null}
        </figure>
      );
    },
  };
}

export function MarkdownRenderer({
  content,
  className,
  emptyFallback = <p className="text-sm text-slate-500">Контент пока не добавлен.</p>,
  attachmentUrls = {},
}: MarkdownRendererProps) {
  if (!content.trim()) {
    return <>{emptyFallback}</>;
  }

  const processedContent = preprocessLegacyMarkdown(content);

  return (
    <div className={className ?? "space-y-4"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
        urlTransform={transformMarkdownUrl}
        components={createComponents(attachmentUrls)}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
