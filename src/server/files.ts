import { isDemoMode } from "./auth";

/** Allowed work sample types (P5.4): PDF, PNG, JPG, DOCX, XLSX. */
export const SAMPLE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

export function maxUploadMb() {
  return isDemoMode() ? 2 : 10;
}

export function maxUploadBytes() {
  return maxUploadMb() * 1024 * 1024;
}

export function blobConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
