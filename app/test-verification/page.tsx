'use client';

import { useState } from 'react';

export default function TestVerification() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testContractTypes = [
    {
      type: 'basic',
      name: 'Test Basic NFT',
      symbol: 'TBN',
      baseTokenURI: 'https://gen-plasma.com/api/metadata/basic/',
      description: 'Basic NFT contract with standard features'
    },
    {
      type: 'pro',
      name: 'Test Pro NFT',
      symbol: 'TPN',
      baseTokenURI: 'https://gen-plasma.com/api/metadata/pro/',
      royaltyRecipient: '0x1234567890123456789012345678901234567890',
      description: 'Pro NFT contract with advanced features and royalties'
    },
    {
      type: 'editions',
      name: 'Test Editions NFT',
      symbol: 'TEN',
      baseTokenURI: 'https://gen-plasma.com/api/metadata/editions/',
      artworkName: 'Test Artwork',
      artworkDescription: 'A test artwork for verification',
      artworkImage: 'https://example.com/artwork.jpg',
      artistName: 'Test Artist',
      description: 'Editions NFT contract for single artwork, multiple copies'
    }
  ];

  const testVerification = async (contractType: any) => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log(`🧪 Testing ${contractType.type} contract verification...`);
      
      // Add test start
      setTestResults(prev => [...prev, {
        id: testId,
        type: contractType.type,
        status: 'testing',
        message: `Testing ${contractType.type} contract verification...`,
        timestamp: new Date().toISOString()
      }]);

      // Test the verification API (using test endpoint for safety)
      const response = await fetch('/api/test/verify-contract-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: '0x0000000000000000000000000000000000000000', // Test address
          contractType: contractType.type,
          contractName: contractType.name,
          symbol: contractType.symbol,
          baseTokenURI: contractType.baseTokenURI,
          ...(contractType.royaltyRecipient && { royaltyRecipient: contractType.royaltyRecipient }),
          ...(contractType.artworkName && { artworkName: contractType.artworkName }),
          ...(contractType.artworkDescription && { artworkDescription: contractType.artworkDescription }),
          ...(contractType.artworkImage && { artworkImage: contractType.artworkImage }),
          ...(contractType.artistName && { artistName: contractType.artistName })
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'success', message: `✅ ${contractType.type} verification API working!`, result }
            : test
        ));
      } else {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', message: `❌ ${contractType.type} verification failed: ${result.error}`, result }
            : test
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: `❌ ${contractType.type} test error: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : test
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const testHardhatVerification = async () => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log('🧪 Testing Hardhat verification setup...');
      
      setTestResults(prev => [...prev, {
        id: testId,
        type: 'hardhat-verification',
        status: 'testing',
        message: 'Testing Hardhat verification setup and configuration...',
        timestamp: new Date().toISOString()
      }]);

      // Test the verification API structure (without actually running Hardhat)
      const response = await fetch('/api/test/test-verification-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: '0x0000000000000000000000000000000000000000', // Test address
          contractType: 'editions',
          contractName: 'Test Editions NFT',
          symbol: 'TEN',
          baseTokenURI: 'https://gen-plasma.com/api/metadata/editions/',
          artworkName: 'Test Artwork',
          artworkDescription: 'A test artwork for verification',
          artworkImage: 'https://example.com/artwork.jpg',
          artistName: 'Test Artist'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'success', message: `✅ Hardhat verification setup working! Constructor args: ${result.constructorArgs?.length || 0} arguments`, result }
            : test
        ));
      } else {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', message: `❌ Hardhat verification setup error: ${result.error}`, result }
            : test
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: `❌ Hardhat verification setup test error: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : test
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const testAllContracts = async () => {
    setTestResults([]);
    for (const contractType of testContractTypes) {
      await testVerification(contractType);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testContractCompilation = async () => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log('🔍 Testing contract compilation...');
      
      setTestResults(prev => [...prev, {
        id: testId,
        type: 'compilation',
        status: 'testing',
        message: 'Testing contract compilation...',
        timestamp: new Date().toISOString()
      }]);

      const response = await fetch('/api/test/compile-contracts');
      const result = await response.json();
      
      if (response.ok) {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'success', message: `✅ Contract compilation test successful! ${result.summary.successful}/${result.summary.total} contracts valid`, result }
            : test
        ));
      } else {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', message: `❌ Contract compilation test failed: ${result.error}`, result }
            : test
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: `❌ Compilation test error: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : test
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const testContractFunctions = async () => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log('🔍 Testing contract functions...');
      
      setTestResults(prev => [...prev, {
        id: testId,
        type: 'functions',
        status: 'testing',
        message: 'Testing available contract functions...',
        timestamp: new Date().toISOString()
      }]);

      const response = await fetch(`/api/test/check-contract-functions?contractAddress=0x385217ECE711499B0A88eFFc6f1c208A92CB5949`);
      const result = await response.json();
      
      if (response.ok) {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'success', message: `✅ Contract functions test successful! ${result.availableFunctions.length}/${result.totalFunctions} functions available`, result }
            : test
        ));
      } else {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', message: `❌ Contract functions test failed: ${result.error}`, result }
            : test
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: `❌ Functions test error: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : test
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const testMetadataAPIs = async () => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log('🧪 Testing metadata APIs...');
      
      setTestResults(prev => [...prev, {
        id: testId,
        type: 'metadata',
        status: 'testing',
        message: 'Testing all metadata APIs...',
        timestamp: new Date().toISOString()
      }]);

      const response = await fetch('/api/test/test-metadata-apis');
      const result = await response.json();
      
      if (response.ok) {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'success', message: `✅ Metadata APIs test successful! ${result.summary.successful}/${result.summary.total} APIs working`, result }
            : test
        ));
      } else {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', message: `❌ Metadata APIs test failed: ${result.error}`, result }
            : test
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: `❌ Metadata APIs test error: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : test
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const testDeploymentFlow = async () => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log('🧪 Testing deployment flow...');
      
      setTestResults(prev => [...prev, {
        id: testId,
        type: 'deployment',
        status: 'testing',
        message: 'Testing deployment flow and contract compilation...',
        timestamp: new Date().toISOString()
      }]);

      const response = await fetch('/api/test/test-deployment-flow');
      const result = await response.json();
      
      if (response.ok) {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'success', message: `✅ Deployment flow test successful! ${result.summary.successfulCompilations}/${result.summary.totalContractTypes} contracts compile, ${result.summary.existingEndpoints}/${result.summary.totalDeploymentEndpoints} endpoints exist`, result }
            : test
        ));
      } else {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', message: `❌ Deployment flow test failed: ${result.error}`, result }
            : test
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: `❌ Deployment flow test error: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : test
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const testCollectionBuilder = async () => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log('🧪 Testing collection builder...');
      
      setTestResults(prev => [...prev, {
        id: testId,
        type: 'builder',
        status: 'testing',
        message: 'Testing collection builder functionality...',
        timestamp: new Date().toISOString()
      }]);

      const response = await fetch('/api/test/test-collection-builder');
      const result = await response.json();
      
      if (response.ok) {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'success', message: `✅ Collection builder test successful! ${result.summary.accessiblePages}/${result.summary.totalPages} pages accessible, ${result.summary.successfulContracts}/${result.summary.totalContractTypes} contracts generate`, result }
            : test
        ));
      } else {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', message: `❌ Collection builder test failed: ${result.error}`, result }
            : test
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: `❌ Collection builder test error: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : test
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const testCollectionBuilderUI = async () => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log('🧪 Testing collection builder UI...');
      
      setTestResults(prev => [...prev, {
        id: testId,
        type: 'builder-ui',
        status: 'testing',
        message: 'Testing collection builder UI components and options...',
        timestamp: new Date().toISOString()
      }]);

      const response = await fetch('/api/test/test-collection-builder-ui');
      const result = await response.json();
      
      if (response.ok) {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'success', message: `✅ Collection builder UI test successful! ${result.summary.accessiblePages}/${result.summary.totalPages} pages accessible, ${result.summary.validFormConfigs}/${result.summary.totalFormValidations} form configs valid`, result }
            : test
        ));
      } else {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', message: `❌ Collection builder UI test failed: ${result.error}`, result }
            : test
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: `❌ Collection builder UI test error: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : test
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const testMintPageSettings = async () => {
    setIsLoading(true);
    const testId = Date.now();
    
    try {
      console.log('🧪 Testing mint page settings...');
      
      setTestResults(prev => [...prev, {
        id: testId,
        type: 'mint-settings',
        status: 'testing',
        message: 'Testing mint page settings table and APIs...',
        timestamp: new Date().toISOString()
      }]);

      const response = await fetch('/api/test/check-mint-page-settings');
      const result = await response.json();
      
      if (response.ok) {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: result.success ? 'success' : 'error', message: result.success ? `✅ Mint page settings test successful! Table exists and is working` : `❌ Mint page settings test failed: ${result.error}`, result }
            : test
        ));
      } else {
        setTestResults(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', message: `❌ Mint page settings test failed: ${result.error}`, result }
            : test
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', message: `❌ Mint page settings test error: ${error instanceof Error ? error.message : 'Unknown error'}` }
          : test
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Contract Verification Test</h1>
        
        <div className="mb-8">
          <p className="text-gray-300 mb-4">
            This page tests the contract verification API for all three contract types: Basic, Pro, and Editions.
            <br />
            <span className="text-blue-300">🆕 New: Auto-verify feature is now integrated into the deployment process!</span>
          </p>
          <div className="flex space-x-4">
            <button
              onClick={testAllContracts}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test All Contract Types'}
            </button>
            <button
              onClick={testContractCompilation}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Contract Compilation'}
            </button>
            <button
              onClick={testContractFunctions}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Contract Functions'}
            </button>
            <button
              onClick={testMetadataAPIs}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Metadata APIs'}
            </button>
            <button
              onClick={testDeploymentFlow}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Deployment Flow'}
            </button>
            <button
              onClick={testCollectionBuilder}
              disabled={isLoading}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Collection Builder'}
            </button>
            <button
              onClick={testCollectionBuilderUI}
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Collection Builder UI'}
            </button>
            <button
              onClick={testMintPageSettings}
              disabled={isLoading}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Mint Page Settings'}
            </button>
            <button
              onClick={testHardhatVerification}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Testing...' : 'Test Hardhat Setup'}
            </button>
            <button
              onClick={clearResults}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Contract Types Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {testContractTypes.map((contractType) => (
            <div key={contractType.type} className="bg-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 capitalize">
                {contractType.type} Contract
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                {contractType.description}
              </p>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {contractType.name}</div>
                <div><strong>Symbol:</strong> {contractType.symbol}</div>
                <div><strong>Base URI:</strong> {contractType.baseTokenURI}</div>
                {contractType.royaltyRecipient && (
                  <div><strong>Royalty Recipient:</strong> {contractType.royaltyRecipient}</div>
                )}
                {contractType.artworkName && (
                  <div><strong>Artwork:</strong> {contractType.artworkName}</div>
                )}
              </div>
              <button
                onClick={() => testVerification(contractType)}
                disabled={isLoading}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Test {contractType.type}
              </button>
            </div>
          ))}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white/5 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : result.status === 'error'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{result.type} Contract</span>
                    <span className="text-sm text-gray-400">{result.timestamp}</span>
                  </div>
                  <p className="text-sm">{result.message}</p>
                  {result.result && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-400">View Details</summary>
                      <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Testing Instructions</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• This test uses placeholder contract addresses (0x0000...)</li>
            <li>• The verification API will be tested for proper request handling</li>
            <li>• Contract source code compilation will be verified</li>
            <li>• Constructor argument encoding will be tested</li>
            <li>• API response format will be validated</li>
            <li>• <strong>Auto-verify feature:</strong> Pro and Editions contracts can now be auto-verified during deployment</li>
            <li>• <strong>Hardhat verification:</strong> Uses Hardhat's built-in verification (no API key required)</li>
            <li>• <strong>Manual verification:</strong> Use <code>npm run verify &lt;contractAddress&gt; [args...]</code> for manual verification</li>
            <li>• <strong>Live deployment:</strong> Auto-verify works during actual contract deployment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
