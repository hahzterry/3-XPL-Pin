'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function AdminContractMappingPage() {
  const { address } = useAccount();
  const [urlSlug, setUrlSlug] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const addMapping = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    if (!urlSlug || !contractAddress) {
      setError('Please fill in both URL slug and contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/add-contract-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          urlSlug: urlSlug.trim(),
          contractAddress: contractAddress.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setUrlSlug('');
        setContractAddress('');
      } else {
        setError(data.error || 'Failed to add contract mapping');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">
              Contract Mapping Admin
            </h1>
            
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-300 mb-2">
                  Add Contract Mapping
                </h2>
                <p className="text-gray-300 text-sm">
                  Map URL slugs to actual contract addresses for metadata APIs.
                  This fixes the issue where Pro/Basic contracts show Picsum images.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL Slug (e.g., test-collection)
                  </label>
                  <input
                    type="text"
                    value={urlSlug}
                    onChange={(e) => setUrlSlug(e.target.value)}
                    placeholder="test-collection"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contract Address
                  </label>
                  <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  onClick={addMapping}
                  disabled={isLoading || !address}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    isLoading || !address
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  {isLoading ? 'Adding Mapping...' : 'Add Contract Mapping'}
                </button>
              </div>

              {result && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">
                    ✅ Mapping Added Successfully!
                  </h3>
                  <pre className="text-green-200 text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-300 mb-2">
                    ❌ Error
                  </h3>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  How to use:
                </h3>
                <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
                  <li>Deploy a new Pro or Basic contract</li>
                  <li>Note the URL slug from the mint page URL</li>
                  <li>Note the actual contract address from deployment</li>
                  <li>Add the mapping using this form</li>
                  <li>Refresh the mint page to see IPFS images</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
