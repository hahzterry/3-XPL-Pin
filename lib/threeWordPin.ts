// lib/threeWordPin.ts

export type Coordinates = {
  lat: number;
  lng: number;
};

export type ThreeWordPin = {
  words: string[];
  pin: string;
  coordinates: Coordinates;
};

const WORD_COUNT = 3;

/**
 * Convert a 3-word PIN into coordinates.
 *
 * Replace the placeholder implementation with
 * your actual 3WORDPIN coordinate algorithm/API.
 */
export function wordsToCoords(words: string[]): Coordinates {
  if (words.length !== WORD_COUNT) {
    throw new Error("A 3WORDPIN must contain exactly 3 words.");
  }

  const normalized = words.map((word) =>
    word.trim().toLowerCase()
  );

  // TODO:
  // Connect your existing 3WORDPIN algorithm here.

  throw new Error(
    `wordsToCoords() not connected yet for ///${normalized.join(".")}`
  );
}

/**
 * Convert coordinates into a 3WORDPIN.
 *
 * Replace the placeholder implementation with
 * your actual 3WORDPIN algorithm/API.
 */
export function coordsToWords(
  lat: number,
  lng: number
): string[] {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates.");
  }

  // TODO:
  // Connect your existing 3WORDPIN algorithm here.

  throw new Error(
    `coordsToWords() not connected yet for ${lat}, ${lng}`
  );
}

/**
 * Validate a 3WORDPIN string.
 *
 * Accepts:
 * ///coffee.lake.moon
 * coffee.lake.moon
 */
export function validateWordPin(pin: string): boolean {
  const normalized = pin
    .trim()
    .replace(/^\/\/\//, "")
    .toLowerCase();

  const words = normalized.split(".");

  if (words.length !== WORD_COUNT) {
    return false;
  }

  return words.every(
    (word) =>
      /^[a-z0-9-]+$/.test(word) &&
      word.length >= 1 &&
      word.length <= 32
  );
}

/**
 * Normalize a 3WORDPIN.
 *
 * ///Coffee.Lake.Moon
 * becomes:
 * coffee.lake.moon
 */
export function normalizeWordPin(pin: string): string {
  return pin
    .trim()
    .replace(/^\/\/\//, "")
    .toLowerCase();
}

/**
 * Format a normalized PIN for display.
 */
export function formatWordPin(pin: string): string {
  return `///${normalizeWordPin(pin)}`;
}

/**
 * Convert a PIN string into its three words.
 */
export function pinToWords(pin: string): string[] {
  const normalized = normalizeWordPin(pin);

  if (!validateWordPin(normalized)) {
    throw new Error("Invalid 3WORDPIN.");
  }

  return normalized.split(".");
}