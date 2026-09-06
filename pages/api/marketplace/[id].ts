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
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Request ID is required",
      });
    }

    const { data, error } = await supabase
      .from("marketplace_requests")
      .select(`
        *,
        listings (
          *,
          locations (*)
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: "Request not found",
      });
    }

    return res.status(200).json({
      request: data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unable to load request",
    });
  }
}
