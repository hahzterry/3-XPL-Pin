import type { NextApiRequest, NextApiResponse } from "next";
import {
  normalizeWordPin,
  wordsToCoords,
} from "../../../lib/threeWordPin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { wordPin } = req.query;

    if (typeof wordPin !== "string") {
      return res.status(400).json({
        error: "wordPin is required",
      });
    }

    const normalized = normalizeWordPin(wordPin);
    const coords = wordsToCoords(normalized);

    if (!coords) {
      return res.status(404).json({
        error: "Invalid 3WORDPIN",
      });
    }

    return res.status(200).json({
      wordPin: normalized,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  } catch (error) {
    console.error("PIN RESOLVE ERROR:", error);

    return res.status(500).json({
      error: "Unable to resolve 3WORDPIN",
    });
  }
}
