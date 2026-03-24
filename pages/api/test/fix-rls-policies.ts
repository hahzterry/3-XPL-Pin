import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Fixing RLS policies for collection_images...');
    
    // Drop existing policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "public can read collection_images" ON collection_images;',
      'DROP POLICY IF EXISTS "public can insert collection_images" ON collection_images;',
      'DROP POLICY IF EXISTS "public can read temp_uploads" ON temp_uploads;',
      'DROP POLICY IF EXISTS "public can insert temp_uploads" ON temp_uploads;'
    ];

    // Create new policies
    const createPolicies = [
      'CREATE POLICY "public can read collection_images" ON collection_images FOR SELECT TO anon USING (true);',
      'CREATE POLICY "public can insert collection_images" ON collection_images FOR INSERT TO anon WITH CHECK (true);',
      'CREATE POLICY "public can read temp_uploads" ON temp_uploads FOR SELECT TO anon USING (true);',
      'CREATE POLICY "public can insert temp_uploads" ON temp_uploads FOR INSERT TO anon WITH CHECK (true);'
    ];

    const results = [];

    // Execute drop policies
    for (const sql of dropPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.log(`⚠️ Drop policy warning:`, error.message);
        } else {
          console.log(`✅ Dropped policy: ${sql}`);
        }
        results.push({ action: 'drop', sql, success: !error, error: error?.message });
      } catch (err) {
        console.log(`⚠️ Drop policy error:`, err);
        results.push({ action: 'drop', sql, success: false, error: err });
      }
    }

    // Execute create policies
    for (const sql of createPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.error(`❌ Create policy error:`, error);
          results.push({ action: 'create', sql, success: false, error: error.message });
        } else {
          console.log(`✅ Created policy: ${sql}`);
          results.push({ action: 'create', sql, success: true });
        }
      } catch (err) {
        console.error(`❌ Create policy error:`, err);
        results.push({ action: 'create', sql, success: false, error: err });
      }
    }

    // Test if we can now insert
    console.log('🧪 Testing insert after policy fix...');
    const testInsert = {
      contract_address: 'test-policy-fix',
      image_url: 'https://picsum.photos/400/400?random=policy-test',
      file_size: 12345,
      mime_type: 'image/jpeg',
      uploaded_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('collection_images')
      .insert(testInsert)
      .select();

    if (insertError) {
      console.error('❌ Test insert still failing:', insertError);
      results.push({ action: 'test_insert', success: false, error: insertError.message });
    } else {
      console.log('✅ Test insert successful after policy fix!');
      results.push({ action: 'test_insert', success: true, data: insertData });
      
      // Clean up test record
      await supabase
        .from('collection_images')
        .delete()
        .eq('contract_address', 'test-policy-fix');
    }

    return res.status(200).json({
      success: true,
      message: 'RLS policies update attempted',
      results: results,
      testInsert: insertError ? { error: insertError.message } : { success: true }
    });

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
    res.status(500).json({ 
      error: 'Failed to fix RLS policies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
