import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface ApproveRequest {
  contractAddress: string;
  adminAddress: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, adminAddress }: ApproveRequest = req.body;

    if (!contractAddress || !adminAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update the collection to be featured
    // Table is called 'contracts' in the database, column is 'featured'
    const { error } = await supabase
      .from('contracts')
      .update({
        featured: true,
        updated_at: new Date().toISOString()
      })
      .eq('contract_address', contractAddress.toLowerCase());

    if (error) {
      console.error('Error approving collection:', error);
      return res.status(500).json({ error: 'Failed to approve collection' });
    }

    res.status(200).json({
      success: true,
      message: 'Collection approved and featured successfully!'
    });
  } catch (error) {
    console.error('Approve collection error:', error);
    res.status(500).json({ 
      error: 'Failed to approve collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

