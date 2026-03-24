import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin/Treasury address
const ADMIN_ADDRESS = '0x36d7885524c591eda18Cf678b49a09772E89dB5c';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, userAddress } = req.body;

    if (!contractAddress || !userAddress) {
      return res.status(400).json({ error: 'Missing contractAddress or userAddress' });
    }

    // Check if user is admin
    if (userAddress.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    console.log(`🔍 Admin ${userAddress} toggling featured status for contract ${contractAddress}`);

    // Get current featured status, create record if it doesn't exist
    let { data: currentContract, error: fetchError } = await supabase
      .from('contracts')
      .select('featured, name')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    if (fetchError) {
      console.log(`Contract ${contractAddress} not found in database, creating record...`);
      
      // Create a basic contract record
      const { data: newContract, error: createError } = await supabase
        .from('contracts')
        .insert({
          contract_address: contractAddress.toLowerCase(),
          name: 'Unknown Collection',
          symbol: 'UNKNOWN',
          contract_type: 'basic',
          max_supply: 10000,
          mint_price: 0.1,
          deployer: userAddress,
          deployed_at: new Date().toISOString(),
          featured: false
        })
        .select('featured, name')
        .single();

      if (createError) {
        console.error('Error creating contract record:', createError);
        return res.status(500).json({ error: 'Failed to create contract record' });
      }

      currentContract = newContract;
      console.log(`✅ Created contract record for ${contractAddress}`);
    }

    if (!currentContract) {
      console.error('Current contract is null after database operations');
      return res.status(500).json({ error: 'Failed to get contract data' });
    }

    const newFeaturedStatus = !currentContract.featured;

    // Update featured status
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update({ featured: newFeaturedStatus })
      .eq('contract_address', contractAddress.toLowerCase())
      .select('featured, name')
      .single();

    if (updateError) {
      console.error('Error updating featured status:', updateError);
      return res.status(500).json({ error: 'Failed to update featured status' });
    }

    if (!updatedContract) {
      console.error('Updated contract is null');
      return res.status(500).json({ error: 'Failed to get updated contract data' });
    }

    console.log(`✅ Contract ${updatedContract.name} featured status updated to: ${newFeaturedStatus}`);

    res.status(200).json({
      success: true,
      contractAddress,
      featured: newFeaturedStatus,
      message: `Collection ${updatedContract.name} is now ${newFeaturedStatus ? 'featured' : 'unfeatured'}`
    });

  } catch (error) {
    console.error('❌ Error toggling featured status:', error);
    res.status(500).json({
      error: 'Failed to toggle featured status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
