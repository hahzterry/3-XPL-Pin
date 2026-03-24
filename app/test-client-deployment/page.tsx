'use client';

import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import Header from '@/components/Header';

export default function TestClientDeployment() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [contractAddress, setContractAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testClientDeployment = async () => {
    if (!address || !walletClient || !publicClient) {
      setResult({ error: 'Wallet not connected' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing client-side deployment...');
      
      // Step 1: Get compiled contract from API
      const compileResponse = await fetch('/api/deploy/deploy-contract-typed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractType: 'basic',
          name: 'TestCollection',
          symbol: 'TEST',
          maxSupply: 100,
          mintPrice: '1000000000000000000', // 1 XPL in wei
          baseTokenURI: 'https://gen-plasma.com/api/metadata/basic/test-collection/',
        })
      });

      const compileResult = await compileResponse.json();
      console.log('📦 Compile result:', compileResult);

      if (!compileResult.success) {
        throw new Error('Contract compilation failed');
      }

      // Step 2: Deploy using user's wallet
      console.log('🚀 Deploying contract with user wallet...');
      const hash = await walletClient.deployContract({
        abi: compileResult.contractABI,
        bytecode: compileResult.contractBytecode as `0x${string}`,
        args: compileResult.constructorArgs.basic,
      });

      console.log('⏳ Waiting for deployment confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const deployedContractAddress = receipt.contractAddress;

      if (!deployedContractAddress) {
        throw new Error('Contract deployment failed - no contract address');
      }

      console.log(`✅ Contract deployed successfully: ${deployedContractAddress}`);

      // Step 3: Verify ownership
      const owner = await publicClient.readContract({
        address: deployedContractAddress as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "owner",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'owner',
      });

      const isUserOwner = owner.toLowerCase() === address.toLowerCase();

      setResult({
        success: true,
        contractAddress: deployedContractAddress,
        transactionHash: hash,
        owner,
        userAddress: address,
        isUserOwner,
        message: isUserOwner ? '✅ User is the contract owner!' : '❌ User is NOT the contract owner'
      });

      setContractAddress(deployedContractAddress);

    } catch (error) {
      console.error('Client deployment test error:', error);
      setResult({ 
        error: 'Client deployment test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkContractStandards = async () => {
    if (!contractAddress) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/check-contract-standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check contract standards', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Test Client-Side Deployment</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contract Address (for testing)
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={testClientDeployment}
              disabled={loading || !address}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Testing...' : 'Test Client Deployment'}
            </button>
            
            <button
              onClick={checkContractStandards}
              disabled={loading || !contractAddress}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Checking...' : 'Check Contract Standards'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-black/50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {!address && (
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
            <p className="text-yellow-200">
              ⚠️ Please connect your wallet to test client-side deployment
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
