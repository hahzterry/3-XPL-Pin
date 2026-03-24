import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Contract {
  id: string;
  address: string;
  name: string;
  symbol: string;
  contract_type: 'basic' | 'pro' | 'editions';
  max_supply: number;
  mint_price: number;
  base_token_uri: string;
  deployed_at: string;
  deployer_address: string;
  created_at: string;
}

export interface CollectionImage {
  id: string;
  contract_address: string;
  image_url: string;
  ipfs_hash?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
}

export interface NFTItem {
  id: string;
  contract_address: string;
  token_id: number;
  name: string;
  description?: string;
  image_url?: string;
  attributes?: any;
  created_at: string;
}

export interface EditionsArtwork {
  id: string;
  contract_address: string;
  artwork_name: string;
  artwork_description: string;
  artwork_image: string;
  artist_name: string;
  created_at: string;
}

export interface ProFeatures {
  id: string;
  contract_address: string;
  royalty_recipient?: string;
  royalty_percentage: number;
  on_chain_storage: boolean;
  created_at: string;
}
