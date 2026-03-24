import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress } = req.query;

    if (!contractAddress || typeof contractAddress !== 'string') {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    console.log(`🔍 Fetching contract type for: ${contractAddress}`);

    // First, try to find the contract in our database tables
    // Check if it's in pro_artwork table (Pro contract)
    const { data: proData, error: proError } = await supabase
      .from('pro_artwork')
      .select('contract_address')
      .eq('contract_address', contractAddress.toLowerCase())
      .limit(1);

    if (proData && proData.length > 0) {
      console.log('✅ Found Pro contract');
      return res.status(200).json({
        success: true,
        contractType: 'pro',
        source: 'database'
      });
    }

    // Check if it's in basic_artwork table (Basic contract)
    const { data: basicData, error: basicError } = await supabase
      .from('basic_artwork')
      .select('contract_address')
      .eq('contract_address', contractAddress.toLowerCase())
      .limit(1);

    if (basicData && basicData.length > 0) {
      console.log('✅ Found Basic contract');
      return res.status(200).json({
        success: true,
        contractType: 'basic',
        source: 'database'
      });
    }

    // Check if it's in editions_artwork table (Editions contract)
    const { data: editionsData, error: editionsError } = await supabase
      .from('editions_artwork')
      .select('contract_address')
      .eq('contract_address', contractAddress.toLowerCase())
      .limit(1);

    if (editionsData && editionsData.length > 0) {
      console.log('✅ Found Editions contract');
      return res.status(200).json({
        success: true,
        contractType: 'editions',
        source: 'database'
      });
    }

    // If not found in database, try to determine from contract features
    // We can check the base URI pattern or other contract characteristics
    console.log('🔍 Contract not found in database, trying to determine from base URI...');

    // For now, default to 'basic' if we can't determine
    // This could be enhanced by checking actual contract functions
    console.log('⚠️ Could not determine contract type, defaulting to basic');
    
    return res.status(200).json({
      success: true,
      contractType: 'basic',
      source: 'default',
      note: 'Could not determine from database, using default'
    });

  } catch (error: any) {
    console.error('❌ Error in get-contract-type API:', error);
    res.status(500).json({
      error: 'Failed to get contract type',
      details: error.message
    });
  }
}
