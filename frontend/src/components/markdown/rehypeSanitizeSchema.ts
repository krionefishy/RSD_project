import { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";

/** Allows only safe inline HTML needed for underline support. */
export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u"],
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? []), "attachment"],
  },
};
