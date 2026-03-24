import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing collection builder functionality...');
    
    // Test the collection builder page accessibility
    const builderPageTests = [
      {
        name: 'Collection Builder Page',
        url: '/create/builder',
        description: 'Main collection builder interface'
      },
      {
        name: 'Create Page',
        url: '/create',
        description: 'Create collection landing page'
      }
    ];

    const pageResults = [];

    for (const test of builderPageTests) {
      try {
        console.log(`🔍 Testing ${test.name}...`);
        
        const response = await fetch(`https://gen-plasma.com${test.url}`);
        
        pageResults.push({
          name: test.name,
          url: test.url,
          description: test.description,
          status: response.ok ? 'accessible' : 'error',
          statusCode: response.status,
          isHtml: response.headers.get('content-type')?.includes('text/html'),
          error: response.ok ? null : `HTTP ${response.status}`
        });
        
        console.log(`✅ ${test.name}: ${response.ok ? 'accessible' : 'error'}`);
        
      } catch (error) {
        pageResults.push({
          name: test.name,
          url: test.url,
          description: test.description,
          status: 'error',
          statusCode: 0,
          isHtml: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ ${test.name} error:`, error);
      }
    }

    // Test contract generation with different configurations
    const contractConfigs = [
      {
        name: 'Basic Contract',
        config: {
          contractType: 'basic',
          name: 'Test Basic Collection',
          symbol: 'TESTBASIC',
          maxSupply: 100,
          mintPrice: '0.01',
          baseTokenURI: 'https://gen-plasma.com/api/metadata/basic/',
          nftItems: [
            {
              id: '1',
              name: 'Test NFT #1',
              description: 'First test NFT',
              attributes: [
                { trait_type: 'Rarity', value: 'Common' },
                { trait_type: 'Color', value: 'Blue' }
              ]
            }
          ]
        }
      },
      {
        name: 'Pro Contract',
        config: {
          contractType: 'pro',
          name: 'Test Pro Collection',
          symbol: 'TESTPRO',
          maxSupply: 50,
          mintPrice: '0.05',
          baseTokenURI: 'https://gen-plasma.com/api/metadata/pro/',
          royaltyRecipient: '0x1234567890123456789012345678901234567890',
          royaltyPercentage: 5,
          onChainStorage: false
        }
      },
      {
        name: 'Editions Contract',
        config: {
          contractType: 'editions',
          name: 'Test Editions Collection',
          symbol: 'TESTEDIT',
          maxSupply: 10,
          mintPrice: '0.1',
          baseTokenURI: 'https://gen-plasma.com/api/metadata/editions/',
          artworkName: 'Digital Masterpiece',
          artworkDescription: 'A unique digital artwork for testing',
          artworkImage: 'https://example.com/artwork.jpg',
          artistName: 'Test Artist'
        }
      }
    ];

    const contractResults = [];

    for (const contractTest of contractConfigs) {
      try {
        console.log(`🔍 Testing ${contractTest.name} generation...`);
        
        const response = await fetch('https://gen-plasma.com/api/test/test-contract-compilation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractType: contractTest.config.contractType,
            name: contractTest.config.name,
            symbol: contractTest.config.symbol,
            maxSupply: contractTest.config.maxSupply,
            mintPrice: contractTest.config.mintPrice
          })
        });
        
        const result = await response.json();
        
        contractResults.push({
          name: contractTest.name,
          config: contractTest.config,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          hasBytecode: result.bytecode && result.bytecode.length > 0,
          hasAbi: result.abi && Array.isArray(result.abi),
          abiLength: result.abi ? result.abi.length : 0,
          bytecodeLength: result.bytecode ? result.bytecode.length : 0,
          error: response.ok ? null : result.error
        });
        
        console.log(`✅ ${contractTest.name} generation: ${response.ok ? 'success' : 'failed'}`);
        
      } catch (error) {
        contractResults.push({
          name: contractTest.name,
          config: contractTest.config,
          status: 'error',
          statusCode: 0,
          hasBytecode: false,
          hasAbi: false,
          abiLength: 0,
          bytecodeLength: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ ${contractTest.name} generation error:`, error);
      }
    }

    // Test IPFS upload functionality
    const ipfsTests = [
      {
        name: 'IPFS Upload API',
        url: '/api/deploy/upload-ipfs',
        method: 'POST',
        description: 'IPFS metadata upload functionality'
      },
      {
        name: 'Editions Upload API',
        url: '/api/deploy/upload-editions',
        method: 'POST',
        description: 'Editions artwork upload functionality'
      }
    ];

    const ipfsResults = [];

    for (const test of ipfsTests) {
      try {
        console.log(`🔍 Testing ${test.name}...`);
        
        const response = await fetch(`https://gen-plasma.com${test.url}`, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}) // Empty body to test endpoint existence
        });
        
        ipfsResults.push({
          name: test.name,
          url: test.url,
          method: test.method,
          description: test.description,
          status: response.status === 400 ? 'exists' : response.status === 404 ? 'missing' : 'unknown',
          statusCode: response.status,
          error: response.status === 404 ? 'Endpoint not found' : null
        });
        
        console.log(`✅ ${test.name}: ${response.status === 400 ? 'exists' : response.status === 404 ? 'missing' : 'unknown'}`);
        
      } catch (error) {
        ipfsResults.push({
          name: test.name,
          url: test.url,
          method: test.method,
          description: test.description,
          status: 'error',
          statusCode: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ ${test.name} error:`, error);
      }
    }

    // Summary
    const summary = {
      totalPages: builderPageTests.length,
      accessiblePages: pageResults.filter(r => r.status === 'accessible').length,
      totalContractTypes: contractConfigs.length,
      successfulContracts: contractResults.filter(r => r.status === 'success').length,
      totalIpfsEndpoints: ipfsTests.length,
      existingIpfsEndpoints: ipfsResults.filter(r => r.status === 'exists').length
    };

    console.log('📊 Collection builder test summary:', summary);

    res.status(200).json({
      success: true,
      summary,
      pageResults,
      contractResults,
      ipfsResults,
      message: `Collection builder test completed: ${summary.accessiblePages}/${summary.totalPages} pages accessible, ${summary.successfulContracts}/${summary.totalContractTypes} contracts generate successfully`
    });

  } catch (error: any) {
    console.error('❌ Collection builder test error:', error);
    res.status(500).json({ 
      error: 'Collection builder test failed', 
      details: error.message 
    });
  }
}
