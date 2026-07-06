import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownRenderer } from "../components/markdown/MarkdownRenderer";
import {
  extractEmbeddedAttachmentIds,
  preprocessLegacyMarkdown,
  sanitizeAttachmentAltText,
  transformMarkdownUrl,
} from "../components/markdown/markdownUtils";

describe("markdownUtils", () => {
  it("converts legacy ++underline++ syntax to HTML underline tags", () => {
    expect(preprocessLegacyMarkdown("++важно++")).toBe("<u>важно</u>");
  });

  it("extracts embedded attachment ids from markdown images", () => {
    expect(extractEmbeddedAttachmentIds("![alt](attachment:12) and ![b](attachment:34)")).toEqual([12, 34]);
  });

  it("sanitizes attachment alt text before embedding it into markdown", () => {
    expect(sanitizeAttachmentAltText(" схема ](1)\n<script> ")).toBe("схема 1 script");
  });

  it("keeps only safe markdown URLs", () => {
    expect(transformMarkdownUrl("https://example.com")).toBe("https://example.com");
    expect(transformMarkdownUrl("mailto:test@example.com")).toBe("mailto:test@example.com");
    expect(transformMarkdownUrl("tel:+79990000000")).toBe("tel:+79990000000");
    expect(transformMarkdownUrl("/kb/materials")).toBe("/kb/materials");
    expect(transformMarkdownUrl("#section")).toBe("#section");
    expect(transformMarkdownUrl("attachment:42")).toBe("attachment:42");
    expect(transformMarkdownUrl("javascript:alert(1)")).toBe("");
    expect(transformMarkdownUrl("//evil.example.com")).toBe("");
  });
});

describe("MarkdownRenderer", () => {
  it("renders headings, lists, tables, and links", () => {
    const content = [
      "## Заголовок",
      "",
      "- пункт один",
      "- пункт два",
      "",
      "| A | B |",
      "|---|---|",
      "| 1 | 2 |",
      "",
      "[ссылка](https://example.com)",
    ].join("\n");

    render(<MarkdownRenderer content={content} />);

    expect(screen.getByRole("heading", { level: 2, name: "Заголовок" })).toBeTruthy();
    expect(screen.getByText("пункт один")).toBeTruthy();
    expect(screen.getByText("пункт два")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("link", { name: "ссылка" }).getAttribute("href")).toBe("https://example.com");
  });

  it("renders HTML underline tags", () => {
    render(<MarkdownRenderer content="Текст с <u>подчёркиванием</u>." />);
    const underlined = screen.getByText("подчёркиванием");
    expect(underlined.className).toContain("underline");
  });

  it("renders legacy ++underline++ syntax", () => {
    render(<MarkdownRenderer content="Текст с ++подчёркиванием++." />);
    const underlined = screen.getByText("подчёркиванием");
    expect(underlined.className).toContain("underline");
  });

  it("renders attachment images when URL is resolved", () => {
    render(
      <MarkdownRenderer
        content="![Подпись](attachment:42)"
        attachmentUrls={{ 42: "https://cdn.example.com/image.jpg" }}
      />,
    );

    const image = screen.getByRole("img", { name: "Подпись" });
    expect(image.getAttribute("src")).toBe("https://cdn.example.com/image.jpg");
    expect(image.className).toContain("block");
    expect(screen.getByText("Подпись")).toBeTruthy();
  });

  it("shows placeholder for broken attachment id", () => {
    render(<MarkdownRenderer content="![alt](attachment:999)" attachmentUrls={{}} />);
    expect(screen.getByText("Изображение недоступно (вложение #999)")).toBeTruthy();
  });

  it("renders attachment images with block spacing classes", () => {
    const { container } = render(
      <MarkdownRenderer
        content="![alt](attachment:1)"
        attachmentUrls={{ 1: "https://cdn.example.com/image.jpg" }}
      />,
    );

    const figure = container.querySelector("figure");
    expect(figure?.className).toContain("my-4");
    expect(figure?.className).toContain("block");
  });

  it("marks paragraph output to preserve single line breaks from stored materials", () => {
    const { container } = render(<MarkdownRenderer content={"первая строка\nвторая строка"} />);
    expect(container.querySelector("p")?.className).toContain("whitespace-pre-line");
  });
});
