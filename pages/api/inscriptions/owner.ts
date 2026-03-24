import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { txHash } = req.query;

    if (!txHash || typeof txHash !== 'string') {
      return res.status(400).json({ error: 'Transaction hash required' });
    }

    // Get inscription details
    const { data: inscription, error: inscriptionError } = await supabase
      .from('inscriptions')
      .select('transaction_hash, from_address, created_at')
      .eq('transaction_hash', txHash)
      .single();

    if (inscriptionError || !inscription) {
      return res.status(404).json({ error: 'Inscription not found' });
    }

    // Get latest transfer (current owner)
    const { data: latestTransfer } = await supabase
      .from('inscription_transfers')
      .select('*')
      .eq('inscription_tx_hash', txHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get transfer history
    const { data: transferHistory } = await supabase
      .from('inscription_transfers')
      .select('*')
      .eq('inscription_tx_hash', txHash)
      .order('created_at', { ascending: false });

    const currentOwner = latestTransfer 
      ? latestTransfer.to_address 
      : inscription.from_address;

    const transferCount = transferHistory?.length || 0;

    return res.status(200).json({
      inscriptionTxHash: inscription.transaction_hash,
      currentOwner,
      originalCreator: inscription.from_address,
      createdAt: inscription.created_at,
      transferCount,
      latestTransfer: latestTransfer || null,
      transferHistory: transferHistory || []
    });

  } catch (error: any) {
    console.error('Error fetching owner:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

