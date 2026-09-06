import {
  normalizeWordPin,
} from "./threeWordPin";

export function getPinUrl(pin: string): string {
  return `/p/${normalizeWordPin(pin)}`;
}