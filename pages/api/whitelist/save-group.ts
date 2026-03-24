import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      contractAddress, 
      groupId, 
      groupTitle, 
      addresses, 
      createdBy,
      mintStartTime,
      mintEndTime,
      timezone,
      isTimeScheduled
    } = req.body;

    if (!contractAddress || !groupId || !groupTitle) {
      return res.status(400).json({ 
        error: 'Contract address, group ID, and group title are required' 
      });
    }

    // Validate addresses array
    const validAddresses = Array.isArray(addresses) ? addresses.filter(addr => 
      typeof addr === 'string' && addr.match(/^0x[a-fA-F0-9]{40}$/)
    ).map(addr => addr.toLowerCase()) : [];

    console.log(`💾 Saving whitelist group: ${groupTitle} for contract ${contractAddress}`);

    // Validate time scheduling if provided
    let startTime = null;
    let endTime = null;
    let isScheduled = isTimeScheduled || false;
    let groupTimezone = timezone || 'UTC';

    if (isScheduled) {
      if (mintStartTime) {
        startTime = new Date(mintStartTime).toISOString();
      }
      if (mintEndTime) {
        endTime = new Date(mintEndTime).toISOString();
      }
      
      // Validate that end time is after start time
      if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({
          error: 'End time must be after start time'
        });
      }
    }

    // Save or update whitelist group
    const { data, error } = await supabase
      .from('whitelist_groups')
      .upsert({
        contract_address: contractAddress.toLowerCase(),
        group_id: groupId,
        group_title: groupTitle,
        addresses: validAddresses,
        created_by: createdBy || null,
        mint_start_time: startTime,
        mint_end_time: endTime,
        timezone: groupTimezone,
        is_time_scheduled: isScheduled,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'contract_address,group_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('❌ Error saving whitelist group:', error);
      return res.status(500).json({
        error: 'Failed to save whitelist group',
        details: error.message
      });
    }

    console.log(`✅ Whitelist group saved successfully`);

    res.status(200).json({
      success: true,
      contractAddress,
      groupId,
      groupTitle,
      addressCount: validAddresses.length,
      isTimeScheduled: isScheduled,
      mintStartTime: startTime,
      mintEndTime: endTime,
      timezone: groupTimezone,
      message: 'Whitelist group saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving whitelist group:', error);
    res.status(500).json({
      error: 'Failed to save whitelist group',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
