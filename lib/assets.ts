import { AssetType } from "./assetTypes";

export type LocationAsset = {
  id: string;

  wordPin: string;

  latitude: number;
  longitude: number;

  type: AssetType;

  title: string;
  description?: string;

  ownerWallet?: string;

  price: number;
  currency: string;

  available: boolean;

  metadataUri?: string;
  contractAddress?: string;
  tokenId?: string;

  createdAt: string;
};