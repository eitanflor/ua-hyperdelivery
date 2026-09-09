// Kept in sync with `providers.documents.parsing.SUPPORTED_EXTENSIONS` on the backend -
// picking anything else here would only fail once it reaches the upload endpoint.
export const ACCEPTED_EXTENSIONS = ".txt,.md,.pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg";

export interface Attachment {
  key: string;
  filename: string;
}

/** One line per attachment, in the shape Distill's prompt already looks for ("If it
 * gives an S3 key, call `s3_get_document_text`") - no agent-side change needed. */
export function withAttachments(text: string, attachments: Attachment[]): string {
  const refs = attachments.map((a) => `Attached: "${a.filename}" (S3 key: ${a.key})`);
  return [...refs, text.trim()].filter(Boolean).join("\n\n");
}
