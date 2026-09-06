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
      q,
      assetType,
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

    if (typeof city === "string") {
      query = query.ilike("locations.city", `%${city}%`);
    }

    if (typeof q === "string" && q.trim()) {
      const search = q.trim();

      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error } = await query
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      results: data || [],
    });
  } catch (error) {
    console.error("SEARCH ERROR:", error);

    return res.status(500).json({
      error: "Unable to search marketplace",
    });
  }
}
