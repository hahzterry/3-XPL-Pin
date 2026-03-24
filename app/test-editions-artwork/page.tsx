'use client';

import { useState } from 'react';

export default function TestEditionsArtworkPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkTable = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/test/check-editions-artwork-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testStoreArtwork = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/deploy/store-editions-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: '0xa7837efcaa52f1ee71a1a779c4c8eb59c5dbb846',
          artworkName: 'Test Artwork',
          artworkDescription: 'A test artwork',
          artworkImage: 'https://ipfs.io/ipfs/QmVACBTYtL619kVxnmipdSZWxUtsmrUSfXJVotuESU7ZSX',
          artistName: 'Test Artist'
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fixTable = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/test/fix-editions-artwork-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Editions Artwork Table Test</h1>
          <p className="text-gray-400">
            Test and fix the editions_artwork table issue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={checkTable}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-4 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Checking...' : '🔍 Check Table Status'}
          </button>

          <button
            onClick={fixTable}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-6 py-4 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Fixing...' : '🔧 Fix Table Structure'}
          </button>

          <button
            onClick={testStoreArtwork}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-4 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : '🎨 Test Store Artwork'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <h3 className="text-red-300 font-semibold mb-2">❌ Error</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {results && (
          <div className={`rounded-lg p-6 ${
            results.success 
              ? 'bg-green-900/50 border border-green-700' 
              : 'bg-red-900/50 border border-red-700'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {results.success ? '✅ Success!' : '❌ Failed'}
            </h2>
            
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>Message:</strong> {results.message}</p>
              {results.tableExists && <p>✅ Table exists and is accessible</p>}
              {results.recordCount !== undefined && <p>📊 Record count: {results.recordCount}</p>}
              {results.error && <p className="text-red-300">❌ Error: {results.error}</p>}
              {results.details && <p className="text-red-300">Details: {results.details}</p>}
              {results.instructions && (
                <div className="mt-4 p-3 bg-yellow-900/50 rounded">
                  <p className="text-yellow-200 font-semibold">📋 Instructions:</p>
                  <p className="text-yellow-100">{results.instructions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Manual Fix Instructions</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>If the table doesn't exist:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to SQL Editor</li>
              <li>Copy and paste the SQL from <code>create-editions-artwork-table.sql</code></li>
              <li>Click "Run" to execute</li>
              <li>Test again with the "Check Table Status" button</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
