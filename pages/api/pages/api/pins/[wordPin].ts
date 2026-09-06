import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabase";

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

    const normalized = wordPin
      .replace(/^\/\/\//, "")
      .trim()
      .toLowerCase();

    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("*")
      .eq("word_pin", normalized)
      .single();

    if (locationError || !location) {
      return res.status(404).json({
        error: "3WORDPIN not found",
      });
    }

    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select(`
        *,
        tiktok_proofs (*),
        availability (*)
      `)
      .eq("location_id", location.id)
      .eq("is_active", true);

    if (listingsError) {
      return res.status(500).json({
        error: listingsError.message,
      });
    }

    return res.status(200).json({
      location,
      listings: listings || [],
    });
  } catch (error) {
    console.error("PIN GET ERROR:", error);

    return res.status(500).json({
      error: "Unable to load 3WORDPIN",
    });
  }
}
