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
      customerWallet,
      requestType,
      startTime,
      endTime,
      pickupPin,
      destinationPin,
      quantity,
      notes,
      totalPrice,
      currency,
    } = req.body;

    if (!listingId || !requestType) {
      return res.status(400).json({
        error: "listingId and requestType are required",
      });
    }

    const { data, error } = await supabase
      .from("marketplace_requests")
      .insert({
        listing_id: listingId,
        customer_wallet: customerWallet
          ? customerWallet.toLowerCase()
          : null,
        request_type: requestType,
        start_time: startTime || null,
        end_time: endTime || null,
        pickup_pin: pickupPin || null,
        destination_pin: destinationPin || null,
        quantity: quantity || null,
        notes: notes || null,
        total_price: Number(totalPrice || 0),
        currency: currency || "USD",
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(201).json({
      request: data,
    });
  } catch (error) {
    console.error("MARKETPLACE REQUEST ERROR:", error);

    return res.status(500).json({
      error: "Unable to create marketplace request",
    });
  }
}
