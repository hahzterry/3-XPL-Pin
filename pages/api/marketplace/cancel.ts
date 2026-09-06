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
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        error: "requestId is required",
      });
    }

    const { data, error } = await supabase
      .from("marketplace_requests")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("status", "pending")
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: "Request could not be cancelled",
      });
    }

    return res.status(200).json({
      request: data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unable to cancel request",
    });
  }
}
