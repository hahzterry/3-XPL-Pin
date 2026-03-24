import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractAddress, tokenId } = req.query;

  if (!contractAddress || typeof contractAddress !== 'string') {
    return res.status(400).json({ error: 'Contract address is required' });
  }

  if (!tokenId || typeof tokenId !== 'string') {
    return res.status(400).json({ error: 'Token ID is required' });
  }

  try {
    console.log(`🧪 Testing metadata API directly for token ${tokenId} in contract ${contractAddress}`);
    
    // Test the metadata API directly
    const host = req.headers.host || 'gen-plasma.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    const metadataApiUrl = `${baseUrl}/api/metadata/basic/${contractAddress}/${tokenId}`;
    console.log(`📡 Calling metadata API: ${metadataApiUrl}`);
    
    const response = await fetch(metadataApiUrl);
    const data = await response.json();
    
    console.log(`📄 Metadata API response status: ${response.status}`);
    console.log(`📄 Metadata API response:`, data);
    
    return res.status(200).json({
      contractAddress,
      tokenId,
      metadataApiUrl,
      responseStatus: response.status,
      metadata: data,
      isUsingPlaceholder: data.image && data.image.includes('picsum.photos'),
      message: response.ok ? 'Metadata API call successful' : 'Metadata API call failed'
    });

  } catch (error) {
    console.error('❌ Error testing metadata API:', error);
    res.status(500).json({ 
      error: 'Failed to test metadata API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
