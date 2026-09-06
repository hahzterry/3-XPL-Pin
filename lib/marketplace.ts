import { AssetType } from "./assetTypes";

export type MarketplaceRequest = {
  listingId: string;

  customerWallet?: string;

  type: AssetType;

  startTime?: string;
  endTime?: string;

  quantity?: number;

  pickupPin?: string;
  destinationPin?: string;

  notes?: string;
};

export type MarketplaceStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";