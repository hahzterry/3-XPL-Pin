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
      startTime,
      endTime,
      status,
    } = req.body;

    if (!listingId || !startTime || !endTime) {
      return res.status(400).json({
        error:
          "listingId, startTime and endTime are required",
      });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        error: "endTime must be after startTime",
      });
    }

    const { data, error } = await supabase
      .from("availability")
      .insert({
        listing_id: listingId,
        start_time: startTime,
        end_time: endTime,
        status: status || "available",
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(201).json({
      availability: data,
    });
  } catch (error) {
    console.error("AVAILABILITY ERROR:", error);

    return res.status(500).json({
      error: "Unable to create availability",
    });
  }
}
