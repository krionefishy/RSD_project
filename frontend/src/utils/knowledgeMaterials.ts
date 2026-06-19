import type { Material, MaterialAttachment } from "../types/knowledge";

export function getSinglePdfAttachment(
  attachments: Pick<MaterialAttachment, "format">[],
): Pick<MaterialAttachment, "format"> | null {
  if (attachments.length !== 1) return null;
  return attachments[0].format.toLowerCase() === "pdf" ? attachments[0] : null;
}

export function isPdfOnlyMaterial(material: Pick<Material, "text" | "attachments">): boolean {
  return material.text.trim() === "" && getSinglePdfAttachment(material.attachments) !== null;
}
