'use client';

import { useState } from 'react';

export default function TestStoragePage() {
  const [testing, setTesting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runStorageTest = async () => {
    setTesting(true);
    setError(null);
    setResults(null);

    try {
      console.log('🧪 Starting storage test...');
      
      const response = await fetch('/api/test/storage-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setResults(data);
      console.log('✅ Storage test completed:', data);

    } catch (err: any) {
      setError(err.message);
      console.error('❌ Storage test failed:', err);
    } finally {
      setTesting(false);
    }
  };

  const createBucket = async () => {
    setCreating(true);
    setError(null);
    setResults(null);

    try {
      console.log('🪣 Creating nft-temp bucket...');
      
      const response = await fetch('/api/test/create-bucket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bucket creation failed');
      }

      setResults(data);
      console.log('✅ Bucket creation completed:', data);

    } catch (err: any) {
      setError(err.message);
      console.error('❌ Bucket creation failed:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            🧪 Supabase Storage Test
          </h1>

          <div className="text-center mb-8 space-y-4">
            <div className="space-x-4">
              <button
                onClick={runStorageTest}
                disabled={testing || creating}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {testing ? '🔄 Testing...' : '🚀 Run Storage Test'}
              </button>
              
              <button
                onClick={createBucket}
                disabled={testing || creating}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {creating ? '🔄 Creating...' : '🪣 Create nft-temp Bucket'}
              </button>
            </div>
            
            <p className="text-gray-300 text-sm">
              First create the bucket, then run the storage test
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <h3 className="text-red-300 font-semibold mb-2">❌ Test Failed</h3>
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {results && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
              <h3 className="text-green-300 font-semibold mb-4 text-xl">
                ✅ All Tests Passed!
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">📦 Buckets Found:</h4>
                  <div className="bg-black/20 rounded p-3">
                    <pre className="text-green-200 text-sm">
                      {JSON.stringify(results.results.buckets, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">🎯 NFT-Temp Bucket:</h4>
                  <div className="bg-black/20 rounded p-3">
                    <pre className="text-green-200 text-sm">
                      {JSON.stringify(results.results.nftTempBucket, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">📁 Files in Bucket:</h4>
                  <div className="bg-black/20 rounded p-3">
                    <pre className="text-green-200 text-sm">
                      {JSON.stringify(results.results.filesInBucket, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">🔗 Public URL Generated:</h4>
                  <div className="bg-black/20 rounded p-3">
                    <p className="text-green-200 text-sm break-all">
                      {results.results.publicUrl}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">📄 Downloaded Content:</h4>
                  <div className="bg-black/20 rounded p-3">
                    <p className="text-green-200 text-sm">
                      "{results.results.downloadedContent}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">🧹 Cleanup:</span>
                  <span className={results.results.cleanupSuccess ? 'text-green-300' : 'text-yellow-300'}>
                    {results.results.cleanupSuccess ? '✅ Success' : '⚠️ Warning'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/create/builder"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              ← Back to Collection Builder
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
