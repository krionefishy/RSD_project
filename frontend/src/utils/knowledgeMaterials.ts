import type { Material, MaterialAttachment } from "../types/knowledge";

const MATERIAL_ATTACHMENT_ACCEPT_PARTS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  "application/pdf",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MATERIAL_ATTACHMENT_ACCEPT = MATERIAL_ATTACHMENT_ACCEPT_PARTS.join(",");
export const PDF_ONLY_ATTACHMENT_ACCEPT = ".pdf,application/pdf";

const IMAGE_ATTACHMENT_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);

export function isImageAttachmentFormat(format: string): boolean {
  return IMAGE_ATTACHMENT_FORMATS.has(format.toLowerCase());
}

export function getSinglePdfAttachment(
  attachments: Pick<MaterialAttachment, "format">[],
): Pick<MaterialAttachment, "format"> | null {
  if (attachments.length !== 1) return null;
  return attachments[0].format.toLowerCase() === "pdf" ? attachments[0] : null;
}

export function isPdfOnlyMaterial(material: Pick<Material, "text" | "attachments">): boolean {
  return material.text.trim() === "" && getSinglePdfAttachment(material.attachments) !== null;
}
