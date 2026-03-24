'use client';

import { useState } from 'react';

export default function TestEditionsMigrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test/run-editions-attributes-migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Migration failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Editions Attributes Migration</h1>
        <p className="text-gray-400 mb-8">
          This page will run the database migration to add attributes support to Editions contracts.
        </p>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Migration Details</h2>
          <ul className="text-gray-300 space-y-2">
            <li>• Adds <code className="bg-gray-700 px-2 py-1 rounded">attributes</code> column (JSONB) to <code className="bg-gray-700 px-2 py-1 rounded">editions_artwork</code> table</li>
            <li>• Creates GIN index for efficient attribute queries</li>
            <li>• Updates existing records with empty attributes array</li>
            <li>• Enables custom traits (like "Gob" and "Punk") in Editions NFT metadata</li>
          </ul>
        </div>

        <button
          onClick={runMigration}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-4 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed mb-8"
        >
          {isLoading ? 'Running Migration...' : '🚀 Run Editions Attributes Migration'}
        </button>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <h3 className="text-red-300 font-semibold mb-2">❌ Error</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-900/50 border border-green-700 rounded-lg p-6">
            <h3 className="text-green-300 font-semibold mb-4">✅ Migration Successful!</h3>
            <p className="text-green-200 mb-4">{result.message}</p>
            
            <h4 className="text-green-300 font-semibold mb-2">Completed Steps:</h4>
            <ul className="text-green-200 space-y-1">
              {result.steps?.map((step: string, index: number) => (
                <li key={index}>• {step}</li>
              ))}
            </ul>
            
            <div className="mt-6 p-4 bg-green-800/30 rounded-lg">
              <h4 className="text-green-300 font-semibold mb-2">🎉 Next Steps:</h4>
              <p className="text-green-200 text-sm">
                The migration is complete! You can now create new Editions contracts with custom attributes. 
                Your "Gob" and "Punk" traits will appear in the NFT metadata.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">How to Test</h3>
          <ol className="text-gray-300 space-y-2">
            <li>1. Run the migration above (if not already done)</li>
            <li>2. Go to <a href="/create/builder" className="text-blue-400 hover:text-blue-300">Collection Builder</a></li>
            <li>3. Select "Editions" contract type</li>
            <li>4. In the "🎨 Editions Artwork Metadata" section, add attributes like:</li>
            <li className="ml-4">• Trait: "Gob", Value: "Punk"</li>
            <li className="ml-4">• Trait: "Style", Value: "Digital Art"</li>
            <li>5. Deploy the contract</li>
            <li>6. Check the NFT metadata - your custom attributes should appear!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
