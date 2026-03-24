import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

const ADMIN_ADDRESS = '0x36d7885524c591eda18Cf678b49a09772E89dB5c';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, contractAddress, urlSlug, isAutomatic } = req.body;

    // Check if user is admin OR if this is an automatic mapping during deployment
    const isAdmin = userAddress?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
    const isAutomaticMapping = isAutomatic === true;
    
    if (!isAdmin && !isAutomaticMapping) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required or automatic mapping flag' });
    }

    if (!contractAddress || !urlSlug) {
      return res.status(400).json({ error: 'Contract address and URL slug are required' });
    }

    console.log(`🔧 Adding contract mapping: ${urlSlug} -> ${contractAddress}`);

    // Create or update contract mapping in database
    const { data, error } = await supabase
      .from('contract_mappings')
      .upsert({
        url_slug: urlSlug.toLowerCase(),
        contract_address: contractAddress.toLowerCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'url_slug',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('❌ Error adding contract mapping:', error);
      return res.status(500).json({ 
        error: 'Failed to add contract mapping',
        details: error.message
      });
    }

    console.log('✅ Contract mapping added successfully');

    res.status(200).json({
      success: true,
      message: 'Contract mapping added successfully',
      mapping: {
        urlSlug: urlSlug.toLowerCase(),
        contractAddress: contractAddress.toLowerCase()
      }
    });

  } catch (error: any) {
    console.error('❌ Error in add-contract-mapping API:', error);
    res.status(500).json({
      error: 'Failed to add contract mapping',
      details: error.message
    });
  }
}
