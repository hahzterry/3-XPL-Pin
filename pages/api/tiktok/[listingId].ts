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
    const { listingId } = req.query;

    if (typeof listingId !== "string") {
      return res.status(400).json({
        error: "listingId is required",
      });
    }

    const { data, error } = await supabase
      .from("tiktok_proofs")
      .select("*")
      .eq("listing_id", listingId)
      .order("is_featured", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      videos: data || [],
    });
  } catch (error) {
    console.error("TIKTOK ERROR:", error);

    return res.status(500).json({
      error: "Unable to load TikTok videos",
    });
  }
}
