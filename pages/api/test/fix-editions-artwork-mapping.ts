import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    
    console.log('🔍 Checking editions_artwork table for existing records...');
    
    // Get all records from editions_artwork table
    const { data: allRecords, error } = await supabase
      .from('editions_artwork')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching records:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch records',
        details: error.message 
      });
    }
    
    console.log(`✅ Found ${allRecords?.length || 0} records in editions_artwork table`);
    
    // Show the records
    const records = allRecords?.map(record => ({
      contract_address: record.contract_address,
      artwork_name: record.artwork_name,
      artist_name: record.artist_name,
      created_at: record.created_at,
      has_attributes: !!record.attributes
    })) || [];
    
    res.status(200).json({
      success: true,
      message: 'Editions artwork records retrieved successfully',
      total_records: allRecords?.length || 0,
      records: records
    });
    
  } catch (error: any) {
    console.error('❌ Error in fix-editions-artwork-mapping:', error);
    res.status(500).json({
      error: 'Failed to check editions artwork mapping',
      details: error.message
    });
  }
}
