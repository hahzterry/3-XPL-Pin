import { AssetType } from "./assetTypes";

export type Listing = {
  id: string;

  wordPin: string;

  type: AssetType;

  title: string;
  description?: string;

  ownerWallet: string;

  price: number;
  currency: string;

  imageUrl?: string;

  websiteUrl?: string;
  bookingUrl?: string;

  isActive: boolean;

  createdAt: string;
};