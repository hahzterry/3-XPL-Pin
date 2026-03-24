import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing all metadata APIs...');
    
    const testContract = '0x385217ECE711499B0A88eFFc6f1c208A92CB5949';
    const testTokenId = '5';
    
    const metadataAPIs = [
      {
        name: 'Basic Metadata API',
        url: `/api/metadata/basic/${testContract}/${testTokenId}`,
        description: 'Basic NFT metadata with IPFS image support'
      },
      {
        name: 'Pro Metadata API',
        url: `/api/metadata/pro/${testContract}/${testTokenId}`,
        description: 'Pro NFT metadata with on-chain storage support'
      },
      {
        name: 'Editions Metadata API',
        url: `/api/metadata/editions/${testContract}/${testTokenId}`,
        description: 'Editions NFT metadata with shared artwork'
      },
      {
        name: 'Collection Metadata API',
        url: `/api/metadata/collection/${testContract}`,
        description: 'Collection-level metadata and images'
      }
    ];

    const results = [];

    for (const api of metadataAPIs) {
      try {
        console.log(`🔍 Testing ${api.name}...`);
        
        const startTime = Date.now();
        const response = await fetch(`https://gen-plasma.com${api.url}`);
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        const data = await response.json();
        
        // Validate metadata structure
        const validation = {
          hasName: typeof data.name === 'string',
          hasDescription: typeof data.description === 'string',
          hasImage: typeof data.image === 'string',
          hasExternalUrl: typeof data.external_url === 'string',
          hasAttributes: Array.isArray(data.attributes),
          hasTokenIdAttribute: data.attributes?.some((attr: any) => attr.trait_type === 'Token ID'),
          hasContractTypeAttribute: data.attributes?.some((attr: any) => attr.trait_type === 'Contract Type' || attr.trait_type === 'Type'),
          imageUrlValid: data.image && (data.image.startsWith('http') || data.image.startsWith('ipfs://')),
          responseTime: responseTime
        };

        results.push({
          api: api.name,
          url: api.url,
          description: api.description,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          responseTime: responseTime,
          validation,
          data: response.ok ? data : null,
          error: response.ok ? null : data.error || 'Unknown error'
        });

        console.log(`✅ ${api.name} test completed in ${responseTime}ms`);

      } catch (error) {
        results.push({
          api: api.name,
          url: api.url,
          description: api.description,
          status: 'error',
          statusCode: 0,
          responseTime: 0,
          validation: {},
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ ${api.name} test failed:`, error);
      }
    }

    // Summary
    const summary = {
      total: metadataAPIs.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    };

    // Validation summary
    const validationSummary = {
      allHaveName: results.every(r => r.validation && 'hasName' in r.validation && r.validation.hasName),
      allHaveDescription: results.every(r => r.validation && 'hasDescription' in r.validation && r.validation.hasDescription),
      allHaveImage: results.every(r => r.validation && 'hasImage' in r.validation && r.validation.hasImage),
      allHaveExternalUrl: results.every(r => r.validation && 'hasExternalUrl' in r.validation && r.validation.hasExternalUrl),
      allHaveAttributes: results.every(r => r.validation && 'hasAttributes' in r.validation && r.validation.hasAttributes),
      allHaveTokenIdAttribute: results.every(r => r.validation && 'hasTokenIdAttribute' in r.validation && r.validation.hasTokenIdAttribute),
      allHaveValidImageUrls: results.every(r => r.validation && 'imageUrlValid' in r.validation && r.validation.imageUrlValid)
    };

    console.log('📊 Metadata API test summary:', summary);
    console.log('📊 Validation summary:', validationSummary);

    res.status(200).json({
      success: true,
      summary,
      validationSummary,
      results,
      message: `Metadata API test completed: ${summary.successful}/${summary.total} successful`
    });

  } catch (error: any) {
    console.error('❌ Metadata API test error:', error);
    res.status(500).json({ 
      error: 'Metadata API test failed', 
      details: error.message 
    });
  }
}
