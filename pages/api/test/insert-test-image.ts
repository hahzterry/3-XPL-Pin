import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress } = req.body;
    
    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    console.log('🧪 Testing database insert for contract:', contractAddress);
    
    // Try to insert a test record
    const testData = {
      contract_address: contractAddress,
      image_url: 'https://picsum.photos/400/400?random=test',
      file_size: 12345,
      mime_type: 'image/jpeg',
      uploaded_at: new Date().toISOString()
    };

    console.log('📤 Test insert data:', testData);

    const { data: insertData, error: dbError } = await supabase
      .from('collection_images')
      .insert(testData)
      .select();

    if (dbError) {
      console.error('❌ Database insert failed:', dbError);
      return res.status(500).json({ 
        error: 'Database insert failed',
        details: dbError.message,
        hint: dbError.hint,
        code: dbError.code,
        details_full: dbError
      });
    }

    console.log('✅ Test insert successful:', insertData);

    // Now try to query it back
    const { data: queryData, error: queryError } = await supabase
      .from('collection_images')
      .select('*')
      .eq('contract_address', contractAddress);

    if (queryError) {
      console.error('❌ Query failed:', queryError);
      return res.status(500).json({ 
        error: 'Query failed',
        details: queryError.message
      });
    }

    console.log('✅ Query successful:', queryData);

    return res.status(200).json({
      success: true,
      insertResult: insertData,
      queryResult: queryData,
      message: 'Test insert and query successful'
    });

  } catch (error) {
    console.error('❌ Error in test insert:', error);
    res.status(500).json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
