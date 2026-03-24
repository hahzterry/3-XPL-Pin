import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, groupId } = req.query;

    if (!contractAddress || !groupId) {
      return res.status(400).json({ error: 'Contract address and group ID are required' });
    }

    console.log(`🔍 Checking mint availability for group ${groupId} in contract ${contractAddress}`);

    // Get whitelist group with time scheduling info
    const { data: group, error } = await supabase
      .from('whitelist_groups')
      .select('*')
      .eq('contract_address', contractAddress.toString().toLowerCase())
      .eq('group_id', groupId.toString())
      .single();

    if (error || !group) {
      console.log(`Group ${groupId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Whitelist group not found'
      });
    }

    // If no time scheduling is enabled, minting is always available (subject to contract-level minting)
    if (!group.is_time_scheduled) {
      return res.status(200).json({
        success: true,
        isMintAvailable: true,
        reason: 'No time restrictions',
        groupTitle: group.group_title,
        mintStartTime: null,
        mintEndTime: null
      });
    }

    const now = new Date();
    const startTime = group.mint_start_time ? new Date(group.mint_start_time) : null;
    const endTime = group.mint_end_time ? new Date(group.mint_end_time) : null;

    let isMintAvailable = false;
    let reason = '';

    if (startTime && endTime) {
      if (now < startTime) {
        isMintAvailable = false;
        reason = `Minting starts at ${startTime.toLocaleString()}`;
      } else if (now > endTime) {
        isMintAvailable = false;
        reason = `Minting ended at ${endTime.toLocaleString()}`;
      } else {
        isMintAvailable = true;
        reason = 'Minting is currently active';
      }
    } else if (startTime && !endTime) {
      if (now < startTime) {
        isMintAvailable = false;
        reason = `Minting starts at ${startTime.toLocaleString()}`;
      } else {
        isMintAvailable = true;
        reason = 'Minting is currently active (no end time set)';
      }
    } else if (!startTime && endTime) {
      if (now > endTime) {
        isMintAvailable = false;
        reason = `Minting ended at ${endTime.toLocaleString()}`;
      } else {
        isMintAvailable = true;
        reason = 'Minting is currently active (no start time set)';
      }
    } else {
      // Both times are null but scheduling is enabled - this shouldn't happen
      isMintAvailable = false;
      reason = 'Time scheduling enabled but no times set';
    }

    console.log(`✅ Mint availability check: ${isMintAvailable} - ${reason}`);

    res.status(200).json({
      success: true,
      isMintAvailable,
      reason,
      groupTitle: group.group_title,
      mintStartTime: group.mint_start_time,
      mintEndTime: group.mint_end_time,
      timezone: group.timezone,
      isTimeScheduled: group.is_time_scheduled
    });

  } catch (error) {
    console.error('❌ Error checking mint availability:', error);
    res.status(500).json({
      error: 'Failed to check mint availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
