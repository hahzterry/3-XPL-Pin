import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, websiteUrl, xProfileUrl } = req.body;

    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    // Update or insert the social links
    const { data, error } = await supabase
      .from('mint_page_settings')
      .upsert({
        contract_address: contractAddress.toLowerCase(),
        website_url: websiteUrl || null,
        x_profile_url: xProfileUrl || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'contract_address'
      });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to update social links' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Social links updated successfully',
      data 
    });

  } catch (error) {
    console.error('Error updating social links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
