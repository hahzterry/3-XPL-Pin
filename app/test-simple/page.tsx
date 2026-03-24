'use client';

import { useState } from 'react';

export default function TestSimplePage() {
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimpleTest = async () => {
    setTesting(true);
    setError(null);
    setResults(null);

    try {
      console.log('🧪 Running simple upload test...');
      
      const response = await fetch('/api/test/simple-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setResults(data);
      console.log('✅ Simple test completed:', data);

    } catch (err: any) {
      setError(err.message);
      console.error('❌ Simple test failed:', err);
    } finally {
      setTesting(false);
    }
  };

  const checkBuckets = async () => {
    setChecking(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Checking buckets...');
      
      const response = await fetch('/api/test/check-buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bucket check failed');
      }

      setResults(data);
      console.log('✅ Bucket check completed:', data);

    } catch (err: any) {
      setError(err.message);
      console.error('❌ Bucket check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            🧪 Simple Upload Test
          </h1>

          <div className="text-center mb-8 space-y-4">
            <div className="space-x-4">
              <button
                onClick={checkBuckets}
                disabled={checking || testing}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {checking ? '🔄 Checking...' : '🔍 Check/Fix Buckets'}
              </button>
              
              <button
                onClick={runSimpleTest}
                disabled={testing || checking}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {testing ? '🔄 Testing...' : '🚀 Run Simple Test'}
              </button>
            </div>
            
            <p className="text-gray-300 text-sm">
              First check/fix buckets, then run the simple test
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
                  <h4 className="text-white font-semibold mb-2">📊 Test Results:</h4>
                  <div className="bg-black/20 rounded p-3">
                    <pre className="text-green-200 text-sm overflow-auto">
                      {JSON.stringify(results.results, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">🔧 Environment:</h4>
                    <div className="bg-black/20 rounded p-3">
                      <p className="text-green-200 text-sm">
                        URL: {results.results.environmentVariables.hasUrl ? '✅' : '❌'}
                      </p>
                      <p className="text-green-200 text-sm">
                        Key: {results.results.environmentVariables.hasKey ? '✅' : '❌'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-semibold mb-2">📦 Buckets:</h4>
                    <div className="bg-black/20 rounded p-3">
                      <p className="text-green-200 text-sm">
                        {results.results.buckets?.join(', ') || 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                {results.results.publicUrl && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">🔗 Test URL:</h4>
                    <div className="bg-black/20 rounded p-3">
                      <p className="text-green-200 text-sm break-all">
                        {results.results.publicUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 text-center space-x-4">
            <a
              href="/debug-upload"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              ← Back to Debug Upload
            </a>
            <a
              href="/test-storage"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              ← Back to Storage Test
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
