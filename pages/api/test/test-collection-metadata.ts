import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractAddress } = req.query;

  if (!contractAddress || typeof contractAddress !== 'string') {
    return res.status(400).json({ error: 'Contract address is required' });
  }

  try {
    console.log(`🧪 Testing collection metadata API for: ${contractAddress}`);
    
    // Test the collection metadata API directly
    const host = req.headers.host || 'gen-plasma.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    console.log(`📡 Calling: ${baseUrl}/api/metadata/collection/${contractAddress}`);
    
    const response = await fetch(`${baseUrl}/api/metadata/collection/${contractAddress}`);
    const data = await response.json();
    
    console.log(`📄 Response status: ${response.status}`);
    console.log(`📄 Response data:`, data);
    
    return res.status(200).json({
      contractAddress,
      apiUrl: `${baseUrl}/api/metadata/collection/${contractAddress}`,
      responseStatus: response.status,
      responseData: data,
      isPlaceholder: data.image && data.image.includes('picsum.photos'),
      message: response.ok ? 'API call successful' : 'API call failed'
    });

  } catch (error) {
    console.error('❌ Error testing collection metadata API:', error);
    res.status(500).json({ 
      error: 'Failed to test collection metadata API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
