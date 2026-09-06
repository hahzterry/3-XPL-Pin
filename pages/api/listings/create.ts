import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabase";

const ASSET_TYPES = [
  "rental",
  "vehicle",
  "driver",
  "delivery",
  "service",
  "business",
  "event",
];

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
      ownerWallet,
      assetType,
      title,
      description,
      price,
      currency,
      imageUrl,
      websiteUrl,
      bookingUrl,
    } = req.body;

    if (!wordPin || !ownerWallet || !assetType || !title) {
      return res.status(400).json({
        error:
          "wordPin, ownerWallet, assetType and title are required",
      });
    }

    if (!ASSET_TYPES.includes(assetType)) {
      return res.status(400).json({
        error: "Invalid assetType",
      });
    }

    const normalizedPin = wordPin
      .replace(/^\/\/\//, "")
      .trim()
      .toLowerCase();

    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id")
      .eq("word_pin", normalizedPin)
      .single();

    if (locationError || !location) {
      return res.status(404).json({
        error: "3WORDPIN location does not exist",
      });
    }

    const { data, error } = await supabase
      .from("listings")
      .insert({
        location_id: location.id,
        owner_wallet: ownerWallet.toLowerCase(),
        asset_type: assetType,
        title,
        description: description || null,
        price: Number(price || 0),
        currency: currency || "USD",
        image_url: imageUrl || null,
        website_url: websiteUrl || null,
        booking_url: bookingUrl || null,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(201).json({
      listing: data,
    });
  } catch (error) {
    console.error("LISTING CREATE ERROR:", error);

    return res.status(500).json({
      error: "Unable to create listing",
    });
  }
}
