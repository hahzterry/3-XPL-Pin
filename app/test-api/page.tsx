'use client';

import { useState } from 'react';

export default function TestAPI() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing API route...');
      
      const response = await fetch('/api/test/upload-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API test failed');
      }

      setResult(data);
      console.log('✅ API test successful:', data);

    } catch (err: any) {
      setError(err.message);
      console.error('❌ API test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">API Test</h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Testing...' : 'Test API Route'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <h3 className="text-green-400 font-semibold mb-2">Success</h3>
            <pre className="text-green-300 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
