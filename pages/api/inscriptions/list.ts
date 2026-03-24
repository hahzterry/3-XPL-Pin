import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, limit = 50, offset = 0 } = req.query;

    console.log('📜 Fetching inscriptions...');

    // First, get all inscriptions (excluding transfers)
    let query = supabase
      .from('inscriptions')
      .select('*')
      .not('data_uri', 'like', 'data:,plasma_inscription_transfer_%') // Exclude transfer transactions
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (offset) {
      query = query.range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );
    }

    const { data: inscriptions, error } = await query;

    if (error) {
      console.error('❌ Error fetching inscriptions:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch inscriptions',
        details: error.message 
      });
    }

    console.log(`✅ Found ${inscriptions?.length || 0} inscriptions`);

    // Get current owners for all inscriptions
    const inscriptionsWithOwners = await Promise.all(
      (inscriptions || []).map(async (inscription) => {
        // Get latest transfer for this inscription
        const { data: latestTransfer } = await supabase
          .from('inscription_transfers')
          .select('to_address')
          .eq('inscription_tx_hash', inscription.transaction_hash)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const currentOwner = latestTransfer 
          ? latestTransfer.to_address 
          : inscription.from_address;

        return {
          ...inscription,
          currentOwner: currentOwner.toLowerCase()
        };
      })
    );

    // Filter by address if provided (check both creator and current owner)
    let filteredInscriptions = inscriptionsWithOwners;
    if (address) {
      const normalizedAddress = (address as string).toLowerCase();
      filteredInscriptions = inscriptionsWithOwners.filter(
        inscription => inscription.currentOwner === normalizedAddress
      );
      console.log(`📜 Filtering by address: ${address} (found ${filteredInscriptions.length})`);
    }

    // Format inscriptions for response
    const formattedInscriptions = filteredInscriptions.map(inscription => ({
      txHash: inscription.transaction_hash,
      from: inscription.from_address,
      to: inscription.to_address,
      dataUri: inscription.data_uri,
      timestamp: new Date(inscription.created_at).getTime(),
      blockNumber: inscription.block_number,
      protocol: inscription.protocol,
      operation: inscription.operation,
      parsedData: inscription.parsed_data,
      currentOwner: inscription.currentOwner
    }));

    res.status(200).json({
      success: true,
      inscriptions: formattedInscriptions,
      total: formattedInscriptions.length
    });

  } catch (error: any) {
    console.error('❌ Error in inscriptions list API:', error);
    res.status(500).json({
      error: 'Failed to fetch inscriptions',
      details: error.message
    });
  }
}

