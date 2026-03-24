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
    const { contractAddress, contractType, userAddress } = req.body;

    if (!contractAddress || !contractType || !userAddress) {
      return res.status(400).json({ error: 'Missing contractAddress, contractType, or userAddress' });
    }

    // Check if user is admin
    if (userAddress.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Validate contract type
    const validTypes = ['basic', 'pro', 'editions', 'custom'];
    if (!validTypes.includes(contractType)) {
      return res.status(400).json({ error: 'Invalid contract type. Must be one of: basic, pro, editions, custom' });
    }

    console.log(`🔧 Admin ${userAddress} updating contract type for ${contractAddress} to ${contractType}`);

    // Check if contract exists in database
    const { data: existingContract, error: fetchError } = await supabase
      .from('contracts')
      .select('contract_type, name')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    if (fetchError) {
      console.log(`Contract ${contractAddress} not found in database, creating record...`);
      
      // Create a basic contract record with the specified type
      const { data: newContract, error: createError } = await supabase
        .from('contracts')
        .insert({
          contract_address: contractAddress.toLowerCase(),
          name: 'Unknown Collection',
          symbol: 'UNKNOWN',
          contract_type: contractType,
          max_supply: 10000,
          mint_price: 0.1,
          deployer: userAddress,
          deployed_at: new Date().toISOString(),
          featured: false
        })
        .select('contract_type, name')
        .single();

      if (createError) {
        console.error('Error creating contract record:', createError);
        return res.status(500).json({ error: 'Failed to create contract record' });
      }

      console.log(`✅ Created contract record for ${contractAddress} with type ${contractType}`);
      
      return res.status(200).json({
        success: true,
        contractAddress,
        contractType,
        message: `Contract created with type ${contractType.toUpperCase()}`,
        action: 'created'
      });
    }

    // Update existing contract type
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update({ contract_type: contractType })
      .eq('contract_address', contractAddress.toLowerCase())
      .select('contract_type, name')
      .single();

    if (updateError) {
      console.error('Error updating contract type:', updateError);
      return res.status(500).json({ error: 'Failed to update contract type' });
    }

    console.log(`✅ Contract ${updatedContract.name} type updated to: ${contractType}`);

    res.status(200).json({
      success: true,
      contractAddress,
      contractType,
      message: `Contract type updated to ${contractType.toUpperCase()}`,
      action: 'updated'
    });

  } catch (error) {
    console.error('❌ Error updating contract type:', error);
    res.status(500).json({
      error: 'Failed to update contract type',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
