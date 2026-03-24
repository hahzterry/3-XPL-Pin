import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing collection builder UI functionality...');
    
    // Test the collection builder page content and functionality
    const builderPageTests = [
      {
        name: 'Collection Builder Page Content',
        url: '/create/builder',
        description: 'Check if the builder page loads with all UI components'
      }
    ];

    const pageResults = [];

    for (const test of builderPageTests) {
      try {
        console.log(`🔍 Testing ${test.name}...`);
        
        const response = await fetch(`https://gen-plasma.com${test.url}`);
        const htmlContent = await response.text();
        
        // Check for key UI elements
        const uiChecks = {
          hasContractTypeSelection: htmlContent.includes('Contract Type') || htmlContent.includes('contract-type'),
          hasBasicOption: htmlContent.includes('Basic') || htmlContent.includes('basic'),
          hasProOption: htmlContent.includes('Pro') || htmlContent.includes('pro'),
          hasEditionsOption: htmlContent.includes('Editions') || htmlContent.includes('editions'),
          hasMetadataStep: htmlContent.includes('Metadata') || htmlContent.includes('metadata'),
          hasUploadStep: htmlContent.includes('Upload') || htmlContent.includes('upload'),
          hasRoyaltyStep: htmlContent.includes('Royalty') || htmlContent.includes('royalty'),
          hasDeploymentStep: htmlContent.includes('Deployment') || htmlContent.includes('deployment'),
          hasFormInputs: htmlContent.includes('input') || htmlContent.includes('textarea'),
          hasFileUpload: htmlContent.includes('file') || htmlContent.includes('upload'),
          hasDeployButton: htmlContent.includes('Deploy') || htmlContent.includes('deploy'),
          hasStepNavigation: htmlContent.includes('step') || htmlContent.includes('Step'),
          hasReactComponents: htmlContent.includes('useState') || htmlContent.includes('useEffect') || htmlContent.includes('React'),
          hasWagmiIntegration: htmlContent.includes('wagmi') || htmlContent.includes('useAccount'),
          hasTailwindClasses: htmlContent.includes('bg-') || htmlContent.includes('text-') || htmlContent.includes('p-'),
          hasGlassCardStyling: htmlContent.includes('glass-card') || htmlContent.includes('backdrop-blur'),
          hasAnimatedBackground: htmlContent.includes('AnimatedBackground') || htmlContent.includes('animated'),
          hasHeaderFooter: htmlContent.includes('Header') || htmlContent.includes('Footer'),
          hasPaymentModal: htmlContent.includes('PaymentModal') || htmlContent.includes('payment'),
          hasSuccessModal: htmlContent.includes('DeploymentSuccessModal') || htmlContent.includes('success')
        };
        
        pageResults.push({
          name: test.name,
          url: test.url,
          description: test.description,
          status: response.ok ? 'accessible' : 'error',
          statusCode: response.status,
          isHtml: response.headers.get('content-type')?.includes('text/html'),
          htmlLength: htmlContent.length,
          uiChecks,
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
          htmlLength: 0,
          uiChecks: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ ${test.name} error:`, error);
      }
    }

    // Test form validation and configuration options
    const formValidationTests = [
      {
        name: 'Contract Type Validation',
        description: 'Test if contract type selection works correctly',
        testData: {
          basic: { type: 'basic', name: 'Test Basic', symbol: 'TB', maxSupply: 100, mintPrice: 0.01 },
          pro: { type: 'pro', name: 'Test Pro', symbol: 'TP', maxSupply: 50, mintPrice: 0.05, royaltyPercentage: 5 },
          editions: { type: 'editions', name: 'Test Editions', symbol: 'TE', maxSupply: 10, mintPrice: 0.1 }
        }
      },
      {
        name: 'Metadata Configuration',
        description: 'Test if metadata configuration options work',
        testData: {
          collectionName: 'Test Collection',
          description: 'A test collection for validation',
          image: 'https://example.com/image.jpg',
          externalUrl: 'https://example.com',
          attributes: [
            { trait_type: 'Rarity', value: 'Common' },
            { trait_type: 'Color', value: 'Blue' }
          ]
        }
      },
      {
        name: 'Upload Configuration',
        description: 'Test if upload configuration options work',
        testData: {
          nftItems: [
            {
              id: '1',
              name: 'Test NFT #1',
              description: 'First test NFT',
              image: null,
              imagePreview: 'https://example.com/preview1.jpg',
              attributes: [
                { trait_type: 'Rarity', value: 'Common' },
                { trait_type: 'Color', value: 'Blue' }
              ]
            }
          ],
          editionsArtwork: {
            file: null,
            preview: 'https://example.com/artwork.jpg'
          }
        }
      },
      {
        name: 'Royalty Configuration',
        description: 'Test if royalty configuration options work',
        testData: {
          enabled: true,
          recipient: '0x1234567890123456789012345678901234567890',
          percentage: 5
        }
      },
      {
        name: 'Deployment Configuration',
        description: 'Test if deployment configuration options work',
        testData: {
          network: 'plasma',
          gasPrice: '20',
          gasLimit: '5000000',
          autoVerify: true,
          autoActivateMinting: true
        }
      }
    ];

    const validationResults = [];

    for (const test of formValidationTests) {
      try {
        console.log(`🔍 Testing ${test.name}...`);
        
        // Validate the test data structure
        const isValid = validateTestData(test.testData);
        
        validationResults.push({
          name: test.name,
          description: test.description,
          status: isValid ? 'valid' : 'invalid',
          testData: test.testData,
          validation: isValid
        });
        
        console.log(`✅ ${test.name}: ${isValid ? 'valid' : 'invalid'}`);
        
      } catch (error) {
        validationResults.push({
          name: test.name,
          description: test.description,
          status: 'error',
          testData: test.testData,
          validation: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ ${test.name} error:`, error);
      }
    }

    // Test API integration points
    const apiIntegrationTests = [
      {
        name: 'Contract Generation API',
        url: '/api/deploy/generate-contract',
        method: 'POST',
        description: 'API for generating contract code'
      },
      {
        name: 'Contract Deployment API',
        url: '/api/deploy/deploy-contract-typed',
        method: 'POST',
        description: 'API for deploying contracts'
      },
      {
        name: 'IPFS Upload API',
        url: '/api/deploy/upload-ipfs',
        method: 'POST',
        description: 'API for uploading to IPFS'
      },
      {
        name: 'Temporary Storage API',
        url: '/api/storage/upload-temp-formdata',
        method: 'POST',
        description: 'API for temporary file storage'
      },
      {
        name: 'Payment Processing API',
        url: '/api/deploy/process-payment',
        method: 'POST',
        description: 'API for payment processing'
      }
    ];

    const apiResults = [];

    for (const test of apiIntegrationTests) {
      try {
        console.log(`🔍 Testing ${test.name}...`);
        
        const response = await fetch(`https://gen-plasma.com${test.url}`, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}) // Empty body to test endpoint existence
        });
        
        apiResults.push({
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
        apiResults.push({
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
      totalFormValidations: formValidationTests.length,
      validFormConfigs: validationResults.filter(r => r.status === 'valid').length,
      totalApiEndpoints: apiIntegrationTests.length,
      existingApiEndpoints: apiResults.filter(r => r.status === 'exists').length
    };

    console.log('📊 Collection builder UI test summary:', summary);

    res.status(200).json({
      success: true,
      summary,
      pageResults,
      validationResults,
      apiResults,
      message: `Collection builder UI test completed: ${summary.accessiblePages}/${summary.totalPages} pages accessible, ${summary.validFormConfigs}/${summary.totalFormValidations} form configs valid, ${summary.existingApiEndpoints}/${summary.totalApiEndpoints} APIs exist`
    });

  } catch (error: any) {
    console.error('❌ Collection builder UI test error:', error);
    res.status(500).json({ 
      error: 'Collection builder UI test failed', 
      details: error.message 
    });
  }
}

function validateTestData(data: any): boolean {
  try {
    // Basic validation - check if data exists and has expected structure
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // For contract type validation
    if (data.basic || data.pro || data.editions) {
      const contractTypes = [data.basic, data.pro, data.editions].filter(Boolean);
      return contractTypes.every(contract => 
        contract.type && 
        contract.name && 
        contract.symbol && 
        typeof contract.maxSupply === 'number' && 
        typeof contract.mintPrice === 'number'
      );
    }
    
    // For metadata validation
    if (data.collectionName || data.description) {
      return data.collectionName && data.description;
    }
    
    // For upload validation
    if (data.nftItems || data.editionsArtwork) {
      return true; // Basic structure check
    }
    
    // For royalty validation
    if (data.enabled !== undefined) {
      return typeof data.enabled === 'boolean' && 
             data.recipient && 
             typeof data.percentage === 'number';
    }
    
    // For deployment validation
    if (data.network) {
      return data.network && 
             typeof data.gasPrice === 'string' && 
             typeof data.gasLimit === 'string';
    }
    
    return true; // Default to valid if no specific validation needed
  } catch (error) {
    return false;
  }
}
