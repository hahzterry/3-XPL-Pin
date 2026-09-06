import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabase";
import {
  normalizeWordPin,
  wordsToCoords,
} from "../../../lib/threeWordPin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      wordPin,
      address,
      city,
      state,
      country,
    } = req.body;

    if (!wordPin) {
      return res.status(400).json({
        error: "wordPin is required",
      });
    }

    const normalized = normalizeWordPin(wordPin);
    const coords = wordsToCoords(normalized);

    if (!coords) {
      return res.status(400).json({
        error: "Invalid 3WORDPIN",
      });
    }

    const { data, error } = await supabase
      .from("locations")
      .upsert(
        {
          word_pin: normalized,
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: address || null,
          city: city || null,
          state: state || null,
          country: country || null,
        },
        {
          onConflict: "word_pin",
        }
      )
      .select()
      .single();

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      location: data,
    });
  } catch (error) {
    console.error("PIN CREATE ERROR:", error);

    return res.status(500).json({
      error: "Unable to create location",
    });
  }
}
