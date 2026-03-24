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

    console.log(`🔍 Fetching whitelist groups for contract: ${contractAddress}`);

    // Get all whitelist groups for this contract
    const { data: groups, error } = await supabase
      .from('whitelist_groups')
      .select('*')
      .eq('contract_address', contractAddress.toLowerCase())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching whitelist groups:', error);
      return res.status(500).json({
        error: 'Failed to fetch whitelist groups',
        details: error.message
      });
    }

    // Transform data to match frontend format
    const whitelistGroups: {[key: string]: {
      title: string, 
      addresses: string[],
      mintStartTime?: string,
      mintEndTime?: string,
      timezone?: string,
      isTimeScheduled?: boolean,
      merkleRoot?: string,
      isActivatedOnchain?: boolean,
      activatedAt?: string
    }} = {};
    
    groups?.forEach(group => {
      whitelistGroups[group.group_id] = {
        title: group.group_title,
        addresses: group.addresses || [],
        mintStartTime: group.mint_start_time,
        mintEndTime: group.mint_end_time,
        timezone: group.timezone,
        isTimeScheduled: group.is_time_scheduled,
        merkleRoot: group.merkle_root,
        isActivatedOnchain: group.is_activated_onchain,
        activatedAt: group.activated_at
      };
    });

    console.log(`✅ Found ${Object.keys(whitelistGroups).length} whitelist groups`);

    res.status(200).json({
      success: true,
      contractAddress,
      groups: whitelistGroups,
      count: Object.keys(whitelistGroups).length
    });

  } catch (error) {
    console.error('❌ Error fetching whitelist groups:', error);
    res.status(500).json({
      error: 'Failed to fetch whitelist groups',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
