import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabase";

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
      listingId,
      videoUrl,
      creatorHandle,
      thumbnailUrl,
      caption,
      isFeatured,
    } = req.body;

    if (!listingId || !videoUrl) {
      return res.status(400).json({
        error: "listingId and videoUrl are required",
      });
    }

    const { data, error } = await supabase
      .from("tiktok_proofs")
      .insert({
        listing_id: listingId,
        video_url: videoUrl,
        creator_handle: creatorHandle || null,
        thumbnail_url: thumbnailUrl || null,
        caption: caption || null,
        is_featured: Boolean(isFeatured),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(201).json({
      tiktok: data,
    });
  } catch (error) {
    console.error("TIKTOK ADD ERROR:", error);

    return res.status(500).json({
      error: "Unable to add TikTok proof",
    });
  }
}
