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
    const {
      assetType,
      wordPin,
      city,
    } = req.query;

    let query = supabase
      .from("listings")
      .select(`
        *,
        locations (*),
        tiktok_proofs (*)
      `)
      .eq("is_active", true);

    if (typeof assetType === "string") {
      query = query.eq("asset_type", assetType);
    }

    if (typeof wordPin === "string") {
      query = query.eq(
        "locations.word_pin",
        wordPin.replace(/^\/\/\//, "").toLowerCase()
      );
    }

    if (typeof city === "string") {
      query = query.ilike("locations.city", city);
    }

    const { data, error } = await query.order(
      "created_at",
      { ascending: false }
    );

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      listings: data || [],
    });
  } catch (error) {
    console.error("LISTINGS ERROR:", error);

    return res.status(500).json({
      error: "Unable to load listings",
    });
  }
}
