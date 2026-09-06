import type { NextApiRequest, NextApiResponse } from "next";
import {
  normalizeWordPin,
  isValidWordPin,
  formatWordPin,
} from "../../../lib/threeWordPin";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { wordPin } = req.query;

  if (typeof wordPin !== "string") {
    return res.status(400).json({
      error: "wordPin is required",
    });
  }

  const normalized = normalizeWordPin(wordPin);

  if (!isValidWordPin(normalized)) {
    return res.status(400).json({
      error: "Invalid 3WORDPIN format",
      expected: "///word.word.word",
    });
  }

  return res.status(200).json({
    wordPin: normalized,
    displayPin: formatWordPin(normalized),
    valid: true,
  });
}
