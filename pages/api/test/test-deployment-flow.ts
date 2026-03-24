import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing deployment flow...');
    
    // Test contract compilation for all types
    const contractTypes = ['basic', 'pro', 'editions'];
    const compilationResults = [];
    
    for (const contractType of contractTypes) {
      try {
        console.log(`🔍 Testing ${contractType} contract compilation...`);
        
        const response = await fetch('https://gen-plasma.com/api/test/test-contract-compilation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractType,
            name: `Test ${contractType.charAt(0).toUpperCase() + contractType.slice(1)} Collection`,
            symbol: `TEST${contractType.toUpperCase()}`,
            maxSupply: 100,
            mintPrice: '0.01'
          })
        });
        
        const result = await response.json();
        
        compilationResults.push({
          contractType,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          hasBytecode: result.bytecode && result.bytecode.length > 0,
          hasAbi: result.abi && Array.isArray(result.abi),
          abiLength: result.abi ? result.abi.length : 0,
          error: response.ok ? null : result.error
        });
        
        console.log(`✅ ${contractType} contract compilation: ${response.ok ? 'success' : 'failed'}`);
        
      } catch (error) {
        compilationResults.push({
          contractType,
          status: 'error',
          statusCode: 0,
          hasBytecode: false,
          hasAbi: false,
          abiLength: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ ${contractType} contract compilation error:`, error);
      }
    }

    // Test deployment API endpoints
    const deploymentTests = [
      {
        name: 'Generate Contract API',
        url: '/api/deploy/generate-contract',
        method: 'POST',
        description: 'Contract compilation and bytecode generation'
      },
      {
        name: 'Deploy Contract API',
        url: '/api/deploy/deploy-contract-typed',
        method: 'POST',
        description: 'Contract deployment to blockchain'
      },
      {
        name: 'Upload IPFS API',
        url: '/api/deploy/upload-ipfs',
        method: 'POST',
        description: 'IPFS metadata upload'
      },
      {
        name: 'Upload Editions API',
        url: '/api/deploy/upload-editions',
        method: 'POST',
        description: 'Editions artwork upload'
      },
      {
        name: 'Process Payment API',
        url: '/api/deploy/process-payment',
        method: 'POST',
        description: 'Payment processing for deployment'
      }
    ];

    const deploymentResults = [];

    for (const test of deploymentTests) {
      try {
        console.log(`🔍 Testing ${test.name}...`);
        
        // Test if the endpoint exists (should return 400 for missing body, not 404)
        const response = await fetch(`https://gen-plasma.com${test.url}`, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}) // Empty body to test endpoint existence
        });
        
        deploymentResults.push({
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
        deploymentResults.push({
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

    // Test contract functions availability (using existing deployed contract)
    const testContractAddress = '0x385217ECE711499B0A88eFFc6f1c208A92CB5949';
    
    try {
      console.log('🔍 Testing contract functions availability...');
      
      const functionsResponse = await fetch(`https://gen-plasma.com/api/test/check-contract-functions?contractAddress=${testContractAddress}`);
      const functionsResult = await functionsResponse.json();
      
      console.log('✅ Contract functions test completed');
      
    } catch (error) {
      console.error('❌ Contract functions test error:', error);
    }

    // Summary
    const summary = {
      totalContractTypes: contractTypes.length,
      successfulCompilations: compilationResults.filter(r => r.status === 'success').length,
      failedCompilations: compilationResults.filter(r => r.status === 'error').length,
      totalDeploymentEndpoints: deploymentTests.length,
      existingEndpoints: deploymentResults.filter(r => r.status === 'exists').length,
      missingEndpoints: deploymentResults.filter(r => r.status === 'missing').length
    };

    console.log('📊 Deployment flow test summary:', summary);

    res.status(200).json({
      success: true,
      summary,
      compilationResults,
      deploymentResults,
      message: `Deployment flow test completed: ${summary.successfulCompilations}/${summary.totalContractTypes} contracts compile successfully, ${summary.existingEndpoints}/${summary.totalDeploymentEndpoints} endpoints exist`
    });

  } catch (error: any) {
    console.error('❌ Deployment flow test error:', error);
    res.status(500).json({ 
      error: 'Deployment flow test failed', 
      details: error.message 
    });
  }
}
