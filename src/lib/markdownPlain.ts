/**
 * Strip common Markdown syntax for short UI previews (support articles, etc.).
 * Does not parse full MD spec; aims for readable plain text.
 */
function stripLine(line: string): string {
  let s = line;
  s = s.replace(/```[^`]*```/g, " ");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/_([^_]+)_/g, "$1");
  s = s.replace(/^#{1,6}\s+/, "");
  s = s.replace(/\s*#{1,6}\s+/g, " ");
  s = s.replace(/^\s*[-*+]\s+/, "");
  s = s.replace(/^\s*\d+\.\s+/, "");
  return s.replace(/\s+/g, " ").trim();
}

/** Single-line preview (e.g. card subtitle). */
export function markdownToPlainPreview(md: string, maxLen = 220): string {
  const raw = md || "";
  const lines = raw.split(/\r?\n/);
  const parts = lines.map(stripLine).filter(Boolean);
  const oneLine = parts.join(" ").replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen).trimEnd()}…`;
}

/** Full article as plain text with line breaks preserved. */
export function markdownToPlainMultiline(md: string): string {
  const raw = md || "";
  return raw
    .split(/\r?\n/)
    .map(stripLine)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
