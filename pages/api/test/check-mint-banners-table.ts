import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Checking mint_banners table...');
    
    // Try to query the mint_banners table
    const { data: banners, error: selectError } = await supabase
      .from('mint_banners')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('❌ Error querying mint_banners:', selectError);
      return res.status(500).json({ 
        error: 'mint_banners table does not exist or has issues',
        details: selectError.message,
        hint: selectError.hint,
        code: selectError.code,
        solution: 'Run the create-mint-banners-table.sql in your Supabase SQL Editor'
      });
    }

    console.log('✅ mint_banners table exists and is accessible');
    
    return res.status(200).json({
      success: true,
      tableExists: true,
      totalBanners: banners?.length || 0,
      recentBanners: banners || [],
      message: 'mint_banners table is working correctly'
    });

  } catch (error) {
    console.error('❌ Error checking mint_banners table:', error);
    res.status(500).json({ 
      error: 'Failed to check mint_banners table',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
