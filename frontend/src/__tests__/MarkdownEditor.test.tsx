import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { MarkdownEditor, type MarkdownEditorHandle } from "../components/markdown/MarkdownEditor";

describe("MarkdownEditor", () => {
  it("inserts attachment markdown via imperative handle", () => {
    const onChange = vi.fn();
    const editorRef = createRef<MarkdownEditorHandle>();

    render(<MarkdownEditor ref={editorRef} value="" onChange={onChange} />);

    editorRef.current?.insertAttachmentImage(7, "Схема");

    expect(onChange).toHaveBeenCalledWith("![Схема](attachment:7)");
  });

  it("sanitizes attachment names before inserting markdown image alt text", () => {
    const onChange = vi.fn();
    const editorRef = createRef<MarkdownEditorHandle>();

    render(<MarkdownEditor ref={editorRef} value="" onChange={onChange} />);

    editorRef.current?.insertAttachmentImage(7, "Схема ](1)\n<script>");

    expect(onChange).toHaveBeenCalledWith("![Схема 1 script](attachment:7)");
  });

  it("uses the shared renderer in preview for attachment images", () => {
    render(
      <MarkdownEditor
        value="![Схема](attachment:7)"
        onChange={() => {}}
        attachmentUrls={{ 7: "https://cdn.example.com/schema.jpg" }}
      />,
    );

    expect(screen.getByRole("img", { name: "Схема" }).getAttribute("src")).toBe(
      "https://cdn.example.com/schema.jpg",
    );
  });
});
