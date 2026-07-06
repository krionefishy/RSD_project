const LEGACY_UNDERLINE_PATTERN = /\+\+([^+]+?)\+\+/g;
const EMBEDDED_ATTACHMENT_PATTERN = /!\[[^\]]*\]\(attachment:(\d+)\)/g;
const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const CONTROL_AND_SPACE_PATTERN = /[\u0000-\u001F\u007F\s]+/g;

/** Converts legacy ++underline++ syntax to <u> for the library renderer. */
export function preprocessLegacyMarkdown(content: string): string {
  return content.replace(LEGACY_UNDERLINE_PATTERN, "<u>$1</u>");
}

/** Returns attachment IDs referenced as inline markdown images. */
export function extractEmbeddedAttachmentIds(content: string): number[] {
  const ids = new Set<number>();
  for (const match of content.matchAll(EMBEDDED_ATTACHMENT_PATTERN)) {
    const id = Number(match[1]);
    if (Number.isFinite(id)) {
      ids.add(id);
    }
  }
  return [...ids];
}

export function isAttachmentImageSrc(src: string | undefined): boolean {
  return typeof src === "string" && src.startsWith("attachment:");
}

export function parseAttachmentId(src: string): number | null {
  if (!isAttachmentImageSrc(src)) return null;
  const id = Number(src.slice("attachment:".length));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function sanitizeAttachmentAltText(value: string): string {
  const normalized = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\\[\]()!<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || "Изображение";
}

/** Keeps safe links only, while allowing attachment: URLs for embedded images. */
export function transformMarkdownUrl(url: string): string {
  const normalized = url.trim();
  if (!normalized) {
    return "";
  }

  const compact = normalized.replace(CONTROL_AND_SPACE_PATTERN, "");
  if (isAttachmentImageSrc(compact)) {
    return compact;
  }

  if (!SCHEME_PATTERN.test(compact)) {
    return compact.startsWith("//") ? "" : normalized;
  }

  const scheme = compact.slice(0, compact.indexOf(":") + 1).toLowerCase();
  if (scheme === "http:" || scheme === "https:" || scheme === "mailto:" || scheme === "tel:") {
    return normalized;
  }

  return "";
}
