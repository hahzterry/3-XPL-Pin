import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface ReviewRequest {
  submissionId: string;
  action: 'approve' | 'deny';
  reviewerAddress: string;
  reviewNotes?: string;
  
  // Additional details for approved collections
  contractType?: 'basic' | 'editions' | 'pro';
  isFeatured?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      submissionId,
      action,
      reviewerAddress,
      reviewNotes,
      contractType,
      isFeatured
    }: ReviewRequest = req.body;

    // Validate required fields
    if (!submissionId || !action || !reviewerAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (action !== 'approve' && action !== 'deny') {
      return res.status(400).json({ error: 'Invalid action. Must be "approve" or "deny"' });
    }

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
      .from('collection_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ error: 'Submission has already been reviewed' });
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('collection_submissions')
      .update({
        status: action === 'approve' ? 'approved' : 'denied',
        reviewed_by: reviewerAddress.toLowerCase(),
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return res.status(500).json({ error: 'Failed to update submission' });
    }

    // If approved, add to contracts table
    if (action === 'approve') {
      const { error: insertError } = await supabase
        .from('contracts')
        .insert({
          contract_address: submission.contract_address,
          name: submission.collection_name,
          symbol: submission.symbol || 'NFT',
          contract_type: contractType || 'basic',
          max_supply: submission.total_supply || 1000,
          mint_price: submission.mint_price || '0',
          deployer_address: submission.submitter_address,
          deployed_at: new Date().toISOString(),
          featured: isFeatured || false,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        // Check if already exists
        if (insertError.code === '23505') { // Unique constraint violation
          console.log('Contract already exists in deployed_contracts');
        } else {
          console.error('Error adding to deployed_contracts:', insertError);
          return res.status(500).json({ 
            error: 'Submission approved but failed to create mint page',
            details: insertError.message
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      action: action,
      message: action === 'approve' 
        ? 'Collection approved and mint page created!' 
        : 'Collection submission denied',
      mintPageUrl: action === 'approve' 
        ? `/mint/${submission.contract_address}` 
        : null
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ 
      error: 'Failed to review submission',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

