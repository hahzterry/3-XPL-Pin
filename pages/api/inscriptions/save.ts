import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      transactionHash,
      fromAddress,
      dataUri,
      blockNumber
    } = req.body;

    if (!transactionHash || !fromAddress || !dataUri) {
      return res.status(400).json({ 
        error: 'Missing required fields: transactionHash, fromAddress, dataUri' 
      });
    }

    console.log('💾 Saving inscription:', transactionHash);

    // Check if this is a transfer transaction (should not be saved as inscription)
    if (dataUri.includes('plasma_inscription_transfer_')) {
      console.log('⏭️ Skipping transfer transaction (not an inscription)');
      return res.status(200).json({
        success: true,
        message: 'Transfer transaction ignored (use /api/inscriptions/transfer endpoint)',
        isTransfer: true
      });
    }

    // Try to parse protocol if it's JSON
    let protocol = 'unknown';
    let operation = null;
    let parsedData = null;

    try {
      // Check if it's a data URI with JSON
      if (dataUri.startsWith('data:,')) {
        const jsonStr = decodeURIComponent(dataUri.substring(6));
        const json = JSON.parse(jsonStr);
        
        if (json.p) {
          protocol = json.p; // e.g., 'erc-20', 'nft'
        }
        if (json.op) {
          operation = json.op; // e.g., 'deploy', 'mint', 'transfer'
        }
        parsedData = json;
      } else if (dataUri.startsWith('data:text/plain')) {
        protocol = 'text';
      } else if (dataUri.startsWith('data:image/')) {
        protocol = 'image';
      }
    } catch (e) {
      // Not JSON, that's okay
      if (dataUri.startsWith('data:text')) {
        protocol = 'text';
      } else if (dataUri.startsWith('data:image')) {
        protocol = 'image';
      }
    }

    // Save to database
    const { data, error } = await supabase
      .from('inscriptions')
      .insert({
        transaction_hash: transactionHash.toLowerCase(),
        block_number: blockNumber || null,
        from_address: fromAddress.toLowerCase(),
        to_address: '0x0000000000000000000000000000000000000000', // Null address
        data_uri: dataUri,
        protocol: protocol,
        operation: operation,
        parsed_data: parsedData,
        is_valid: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate (already exists)
      if (error.code === '23505') {
        console.log('ℹ️ Inscription already exists:', transactionHash);
        return res.status(200).json({
          success: true,
          message: 'Inscription already recorded',
          duplicate: true
        });
      }

      console.error('❌ Error saving inscription:', error);
      return res.status(500).json({ 
        error: 'Failed to save inscription',
        details: error.message 
      });
    }

    console.log('✅ Inscription saved:', transactionHash);

    res.status(200).json({
      success: true,
      inscription: data,
      message: 'Inscription saved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error in inscriptions save API:', error);
    res.status(500).json({
      error: 'Failed to save inscription',
      details: error.message
    });
  }
}

