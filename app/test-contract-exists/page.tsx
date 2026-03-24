'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TestContractExists() {
  const [contractAddress, setContractAddress] = useState('0x7909a3663e4b66d4db6c75e466e954577c34a5ba');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkContract = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test/check-contract-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check contract', details: error });
    } finally {
      setLoading(false);
    }
  };

  const checkFunctions = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test/check-contract-functions-detailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check functions', details: error });
    } finally {
      setLoading(false);
    }
  };

  const checkOwner = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test/check-contract-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contractAddress,
          userAddress: '0x0aB705B9734CB776A8F5b18c9036c14C6828933F' // Your address from the logs
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check owner', details: error });
    } finally {
      setLoading(false);
    }
  };

  const transferOwnership = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/transfer-ownership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contractAddress,
          newOwnerAddress: '0x0aB705B9734CB776A8F5b18c9036c14C6828933F' // Your current wallet
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to transfer ownership', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Test Contract Exists</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Contract Address:</label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              placeholder="0x..."
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={checkContract}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Checking...' : 'Check Contract'}
            </button>
            
            <button
              onClick={checkFunctions}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Checking...' : 'Check Functions'}
            </button>
            
            <button
              onClick={checkOwner}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Checking...' : 'Check Owner'}
            </button>
            
            <button
              onClick={transferOwnership}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Transferring...' : 'Transfer Ownership'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Result:</h2>
            <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
