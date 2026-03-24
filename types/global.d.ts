declare global {
  var collectionImages: Map<string, {
    contractAddress: string;
    imageUrl: string;
    mimeType: string | null;
    originalFilename: string | null;
    uploadedAt: string;
    size: number;
    ipfsHash?: string;
    ipfsUrl?: string;
    gatewayUrl?: string;
    pricing?: {
      tier: string;
      cost: number;
      currency: string;
    };
  }> | undefined;
  
  var ipfsImages: Map<string, {
    contractAddress: string;
    ipfsHash: string;
    ipfsUrl: string;
    gatewayUrl: string;
    fileSize: number;
    mimeType: string | null;
    originalFilename: string | null;
    uploadedAt: string;
    pricing: {
      tier: string;
      cost: number;
      currency: string;
    };
  }> | undefined;
}

export {};
