import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Fetching unapproved deployed collections...');
    
    // Get all deployed contracts that are not featured (not approved)
    // Table is called 'contracts' in the database
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error fetching collections:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch collections',
        details: error.message,
        hint: error.hint,
        code: error.code
      });
    }

    console.log(`✅ Found ${data?.length || 0} deployed contracts`);
    
    // Filter out featured ones (use 'featured' column)
    const unfeatured = data?.filter(c => !c.featured) || [];
    console.log(`📊 ${unfeatured.length} are not featured`);

    res.status(200).json({
      success: true,
      collections: unfeatured,
      count: unfeatured.length
    });
  } catch (error) {
    console.error('❌ Get unapproved collections error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch collections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

