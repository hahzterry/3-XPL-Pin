export function normalizeWordPin(value: string): string {
  return value
    .replace(/^\/\/\//, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".");
}

export function isValidWordPin(value: string): boolean {
  const normalized = normalizeWordPin(value);

  return /^[a-z0-9_-]+\.[a-z0-9_-]+\.[a-z0-9_-]+$/.test(
    normalized
  );
}

export function formatWordPin(value: string): string {
  const normalized = normalizeWordPin(value);

  return `///${normalized}`;
}
