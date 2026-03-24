import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      inscriptionTxHash, 
      fromAddress, 
      toAddress, 
      transferTxHash,
      blockNumber 
    } = req.body;

    // Validate required fields
    if (!inscriptionTxHash || !fromAddress || !toAddress || !transferTxHash) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['inscriptionTxHash', 'fromAddress', 'toAddress', 'transferTxHash']
      });
    }

    // Validate addresses (basic check)
    if (!inscriptionTxHash.startsWith('0x') || !fromAddress.startsWith('0x') || 
        !toAddress.startsWith('0x') || !transferTxHash.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid address or transaction hash format' });
    }

    // Check if inscription exists
    const { data: inscription, error: inscriptionError } = await supabase
      .from('inscriptions')
      .select('transaction_hash, from_address')
      .eq('transaction_hash', inscriptionTxHash)
      .single();

    if (inscriptionError || !inscription) {
      return res.status(404).json({ error: 'Inscription not found' });
    }

    // Get current owner (latest transfer or original creator)
    const { data: latestTransfer } = await supabase
      .from('inscription_transfers')
      .select('to_address')
      .eq('inscription_tx_hash', inscriptionTxHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentOwner = latestTransfer 
      ? latestTransfer.to_address.toLowerCase() 
      : inscription.from_address.toLowerCase();

    // Verify that fromAddress is the current owner
    if (currentOwner !== fromAddress.toLowerCase()) {
      return res.status(403).json({ 
        error: 'Transfer rejected: sender is not current owner',
        currentOwner,
        attemptedFrom: fromAddress
      });
    }

    // Check for duplicate transfer transaction
    const { data: existingTransfer } = await supabase
      .from('inscription_transfers')
      .select('id')
      .eq('transfer_tx_hash', transferTxHash)
      .single();

    if (existingTransfer) {
      return res.status(409).json({ 
        error: 'Transfer already recorded',
        transferId: existingTransfer.id
      });
    }

    // Record the transfer
    const { data: transfer, error: transferError } = await supabase
      .from('inscription_transfers')
      .insert({
        inscription_tx_hash: inscriptionTxHash,
        from_address: fromAddress.toLowerCase(),
        to_address: toAddress.toLowerCase(),
        transfer_tx_hash: transferTxHash,
        block_number: blockNumber || null
      })
      .select()
      .single();

    if (transferError) {
      console.error('Error recording transfer:', transferError);
      return res.status(500).json({ error: 'Failed to record transfer' });
    }

    console.log(`✅ Transfer recorded: ${inscriptionTxHash} from ${fromAddress} to ${toAddress}`);

    return res.status(200).json({
      success: true,
      transfer,
      message: 'Transfer recorded successfully'
    });

  } catch (error: any) {
    console.error('Error in transfer API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

