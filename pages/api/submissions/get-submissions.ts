import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, adminAddress } = req.query;

    // Optional: Add admin address verification here
    // For now, we'll just return submissions based on status

    let query = supabase
      .from('collection_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    // Filter by status if provided
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }

    res.status(200).json({
      success: true,
      submissions: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch submissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

