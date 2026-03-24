import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Checking collection_images table...');
    
    // Check if table exists and get all records
    const { data: allImages, error: selectError } = await supabase
      .from('collection_images')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(10);

    if (selectError) {
      console.error('❌ Error querying collection_images:', selectError);
      return res.status(500).json({ 
        error: 'Database query failed', 
        details: selectError.message,
        hint: selectError.hint,
        code: selectError.code
      });
    }

    console.log('✅ Found collection images:', allImages?.length || 0);
    
    // Also check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('collection_images')
      .select('*')
      .limit(1);

    return res.status(200).json({
      success: true,
      totalRecords: allImages?.length || 0,
      recentImages: allImages || [],
      tableExists: !tableError,
      tableError: tableError?.message || null
    });

  } catch (error) {
    console.error('❌ Error checking collection images:', error);
    res.status(500).json({ 
      error: 'Failed to check collection images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
