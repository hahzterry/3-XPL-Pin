'use client';

import { useState } from 'react';

export default function TestEditionsFixPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [isMapping, setIsMapping] = useState(false);
  const [mappingResult, setMappingResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [isComprehensive, setIsComprehensive] = useState(false);
  const [comprehensiveResult, setComprehensiveResult] = useState<any>(null);
  const [isBasic, setIsBasic] = useState(false);
  const [basicResult, setBasicResult] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addResult, setAddResult] = useState<any>(null);

  const checkDatabase = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test/fix-editions-artwork-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to check database');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fixPlasmaGobs2 = async () => {
    setIsFixing(true);
    setFixResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test/update-editions-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldKey: 'plasma-gobs',
          newKey: 'plasma-gobs-2',
          artworkName: 'The Gob Punk',
          artworkDescription: 'A unique digital artwork featuring gob punk style',
          artistName: 'Merlini',
          attributes: [
            { trait_type: 'Gob', value: 'Punk' },
            { trait_type: 'Style', value: 'Digital Art' }
          ]
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setFixResult(data);
      } else {
        setError(data.error || 'Failed to fix plasma-gobs-2');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsFixing(false);
    }
  };

  const fixContractMapping = async () => {
    setIsMapping(true);
    setMappingResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test/fix-contract-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        setMappingResult(data);
      } else {
        setError(data.error || 'Failed to fix contract mapping');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsMapping(false);
    }
  };

  const checkSpecificContracts = async () => {
    setIsChecking(true);
    setCheckResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test/check-specific-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        setCheckResult(data);
      } else {
        setError(data.error || 'Failed to check specific contracts');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsChecking(false);
    }
  };

  const runComprehensiveFix = async () => {
    setIsComprehensive(true);
    setComprehensiveResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test/comprehensive-editions-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        setComprehensiveResult(data);
      } else {
        setError(data.error || 'Failed to run comprehensive fix');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsComprehensive(false);
    }
  };

  const runBasicFix = async () => {
    setIsBasic(true);
    setBasicResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test/basic-editions-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        setBasicResult(data);
      } else {
        setError(data.error || 'Failed to run basic fix');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsBasic(false);
    }
  };

  const addPweseMapping = async () => {
    setIsAdding(true);
    setAddResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test/add-contract-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlSlug: 'pwese',
          contractAddress: '0x6ca101579e61a68cc4960c9dd711a741b32259b7',
          artworkName: 'Pwese Artwork',
          artworkDescription: 'A unique digital artwork',
          artistName: 'Merlini',
          artworkImage: 'https://picsum.photos/400/400?random=9289' // You can update this to IPFS later
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setAddResult(data);
      } else {
        setError(data.error || 'Failed to add contract mapping');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Editions Artwork Database Check</h1>
        <p className="text-gray-400 mb-8">
          This page will check what's currently stored in the editions_artwork table to help fix the missing artwork data issue.
        </p>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Issue Description</h2>
          <p className="text-gray-300 mb-4">
            The metadata API is looking for artwork data for contract "plasma-gobs-2" but can't find it. 
            This suggests there's a mismatch between how the data is stored and how it's being retrieved.
          </p>
          <ul className="text-gray-300 space-y-2">
            <li>• Contract URL: <code className="bg-gray-700 px-2 py-1 rounded">/api/metadata/editions/plasma-gobs-2/1</code></li>
            <li>• Expected: Artwork data stored with key "plasma-gobs-2"</li>
            <li>• Actual: May be stored with actual contract address (0x...)</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={checkDatabase}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Checking...' : '🔍 Check All'}
          </button>
          
          <button
            onClick={checkSpecificContracts}
            disabled={isChecking}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed text-sm"
          >
            {isChecking ? 'Checking...' : '🔍 Check Specific'}
          </button>
          
          <button
            onClick={runBasicFix}
            disabled={isBasic}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed text-sm"
          >
            {isBasic ? 'Fixing...' : '🔧 Fix Basic Data'}
          </button>
          
          <button
            onClick={addPweseMapping}
            disabled={isAdding}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed text-sm"
          >
            {isAdding ? 'Adding...' : '🔧 Fix pwese Contract'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={runComprehensiveFix}
            disabled={isComprehensive}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed text-sm"
          >
            {isComprehensive ? 'Fixing...' : '🚀 Fix Everything'}
          </button>
          
          <button
            onClick={fixPlasmaGobs2}
            disabled={isFixing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed text-sm"
          >
            {isFixing ? 'Fixing...' : '🔧 Fix plasma-gobs-2'}
          </button>
          
          <button
            onClick={fixContractMapping}
            disabled={isMapping}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed text-sm"
          >
            {isMapping ? 'Mapping...' : '🗺️ Fix Mapping'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <h3 className="text-red-300 font-semibold mb-2">❌ Error</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {fixResult && (
          <div className="bg-green-900/50 border border-green-700 rounded-lg p-6 mb-6">
            <h3 className="text-green-300 font-semibold mb-4">✅ Fix Applied Successfully!</h3>
            <p className="text-green-200 mb-4">{fixResult.message}</p>
            
            <div className="bg-green-800/30 rounded-lg p-4">
              <h4 className="text-green-300 font-semibold mb-2">🎉 What was fixed:</h4>
              <ul className="text-green-200 text-sm space-y-1">
                <li>• Updated contract address from "plasma-gobs" to "plasma-gobs-2"</li>
                <li>• Set artwork name to "The Gob Punk"</li>
                <li>• Set artist name to "Merlini"</li>
                <li>• Added custom attributes: "Gob: Punk" and "Style: Digital Art"</li>
              </ul>
            </div>
            
            <div className="mt-4 p-4 bg-blue-800/30 rounded-lg">
              <h4 className="text-blue-300 font-semibold mb-2">🚀 Test the fix:</h4>
              <p className="text-blue-200 text-sm">
                Now test the metadata API: <code className="bg-blue-700 px-2 py-1 rounded">/api/metadata/editions/plasma-gobs-2/1</code>
              </p>
            </div>
          </div>
        )}

        {mappingResult && (
          <div className="bg-purple-900/50 border border-purple-700 rounded-lg p-6 mb-6">
            <h3 className="text-purple-300 font-semibold mb-4">✅ Contract Mapping Fixed!</h3>
            <p className="text-purple-200 mb-4">{mappingResult.message}</p>
            
            <div className="space-y-4">
              {mappingResult.results?.map((result: any, index: number) => (
                <div key={index} className="bg-purple-800/30 rounded-lg p-4">
                  <h4 className="text-purple-300 font-semibold mb-2">
                    {result.success ? '✅' : '❌'} {result.urlSlug}
                  </h4>
                  <div className="text-sm text-purple-200 space-y-1">
                    <p><strong>Contract Address:</strong> {result.contractAddress}</p>
                    {result.success ? (
                      <p className="text-green-300">Successfully mapped and stored artwork data</p>
                    ) : (
                      <p className="text-red-300">Error: {result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-blue-800/30 rounded-lg">
              <h4 className="text-blue-300 font-semibold mb-2">🚀 Test the fix:</h4>
              <p className="text-blue-200 text-sm">
                Now test both contracts:
              </p>
              <ul className="text-blue-200 text-sm mt-2 space-y-1">
                <li>• <code className="bg-blue-700 px-2 py-1 rounded">/api/metadata/editions/plasma-gobs/1</code></li>
                <li>• <code className="bg-blue-700 px-2 py-1 rounded">/api/metadata/editions/plasma-gobs-2/1</code></li>
              </ul>
            </div>
          </div>
        )}

        {addResult && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 mb-6">
            <h3 className="text-red-300 font-semibold mb-4">🔧 Contract Mapping Added!</h3>
            <p className="text-red-200 mb-4">{addResult.message}</p>
            
            <div className="bg-red-800/30 rounded-lg p-4">
              <h4 className="text-red-300 font-semibold mb-2">✅ What was added:</h4>
              <div className="text-sm text-red-200 space-y-1">
                <p><strong>URL Slug:</strong> {addResult.urlSlug}</p>
                <p><strong>Contract Address:</strong> {addResult.contractAddress}</p>
                <p><strong>Artwork Name:</strong> {addResult.artworkRecord?.artwork_name}</p>
                <p><strong>Artist:</strong> {addResult.artworkRecord?.artist_name}</p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-800/30 rounded-lg">
              <h4 className="text-blue-300 font-semibold mb-2">🚀 Test the fix:</h4>
              <p className="text-blue-200 text-sm">
                Now test the metadata API: <code className="bg-blue-700 px-2 py-1 rounded">/api/metadata/editions/pwese/1</code>
              </p>
            </div>
          </div>
        )}

        {basicResult && (
          <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-6 mb-6">
            <h3 className="text-yellow-300 font-semibold mb-4">🔧 Basic Fix Results</h3>
            <p className="text-yellow-200 mb-4">{basicResult.message}</p>
            
            <div className="bg-yellow-800/30 rounded-lg p-4 mb-4">
              <h4 className="text-yellow-300 font-semibold mb-2">📊 Summary:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-yellow-400">Total Processed:</span>
                  <p className="text-white font-semibold">{basicResult.summary?.total_processed}</p>
                </div>
                <div>
                  <span className="text-green-400">Successful:</span>
                  <p className="text-white font-semibold">{basicResult.summary?.successful}</p>
                </div>
                <div>
                  <span className="text-red-400">Failed:</span>
                  <p className="text-white font-semibold">{basicResult.summary?.failed}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {basicResult.results?.map((result: any, index: number) => (
                <div key={index} className="bg-yellow-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-yellow-300 font-semibold">
                      {result.success ? '✅' : '❌'} {result.contractAddress}
                    </h4>
                  </div>
                  {result.success ? (
                    <div className="text-sm text-yellow-200 mt-1">
                      <p><strong>Artwork:</strong> {result.data.artwork_name}</p>
                      <p><strong>Artist:</strong> {result.data.artist_name}</p>
                    </div>
                  ) : (
                    <p className="text-red-300 text-sm mt-1">Error: {result.error}</p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-blue-800/30 rounded-lg">
              <h4 className="text-blue-300 font-semibold mb-2">📋 Next Steps:</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                {basicResult.next_steps?.map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {comprehensiveResult && (
          <div className="bg-orange-900/50 border border-orange-700 rounded-lg p-6 mb-6">
            <h3 className="text-orange-300 font-semibold mb-4">🚀 Comprehensive Fix Results</h3>
            <p className="text-orange-200 mb-4">{comprehensiveResult.message}</p>
            
            <div className="bg-orange-800/30 rounded-lg p-4 mb-4">
              <h4 className="text-orange-300 font-semibold mb-2">📊 Summary:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-orange-400">Total Processed:</span>
                  <p className="text-white font-semibold">{comprehensiveResult.summary?.total_processed}</p>
                </div>
                <div>
                  <span className="text-green-400">Successful:</span>
                  <p className="text-white font-semibold">{comprehensiveResult.summary?.successful}</p>
                </div>
                <div>
                  <span className="text-red-400">Failed:</span>
                  <p className="text-white font-semibold">{comprehensiveResult.summary?.failed}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {comprehensiveResult.results?.map((result: any, index: number) => (
                <div key={index} className="bg-orange-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-orange-300 font-semibold">
                      {result.success ? '✅' : '❌'} {result.contractAddress}
                    </h4>
                    {result.success && (
                      <span className="text-green-300 text-sm">
                        {result.data.attributes_count} attributes
                      </span>
                    )}
                  </div>
                  {result.success ? (
                    <div className="text-sm text-orange-200 mt-1">
                      <p><strong>Artwork:</strong> {result.data.artwork_name}</p>
                      <p><strong>Artist:</strong> {result.data.artist_name}</p>
                    </div>
                  ) : (
                    <p className="text-red-300 text-sm mt-1">Error: {result.error}</p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-green-800/30 rounded-lg">
              <h4 className="text-green-300 font-semibold mb-2">🎉 Fix Complete!</h4>
              <p className="text-green-200 text-sm">
                All contract addresses now have artwork data with custom attributes. 
                Test the metadata APIs to see your "Gob" and "Punk" traits!
              </p>
            </div>
          </div>
        )}

        {checkResult && (
          <div className="bg-cyan-900/50 border border-cyan-700 rounded-lg p-6 mb-6">
            <h3 className="text-cyan-300 font-semibold mb-4">🔍 Specific Contract Check Results</h3>
            <p className="text-cyan-200 mb-4">{checkResult.message}</p>
            
            <div className="space-y-4">
              {checkResult.results?.map((result: any, index: number) => (
                <div key={index} className="bg-cyan-800/30 rounded-lg p-4">
                  <h4 className="text-cyan-300 font-semibold mb-2">
                    {result.found ? '✅' : '❌'} {result.contractAddress}
                  </h4>
                  {result.found ? (
                    <div className="text-sm text-cyan-200 space-y-1">
                      <p><strong>Artwork Name:</strong> {result.data.artwork_name}</p>
                      <p><strong>Artist:</strong> {result.data.artist_name}</p>
                      <p><strong>Image:</strong> {result.data.artwork_image ? 'Has image' : 'No image'}</p>
                      <p><strong>Attributes:</strong> {result.data.attributes ? `${result.data.attributes.length} attributes` : 'No attributes'}</p>
                      <p><strong>Created:</strong> {new Date(result.data.created_at).toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-red-300 text-sm">Not found: {result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-green-300 font-semibold mb-4">✅ Database Check Results</h3>
            <p className="text-green-200 mb-4">
              Found {result.total_records} records in editions_artwork table
            </p>
            
            {result.records && result.records.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-white font-semibold">Records Found:</h4>
                {result.records.map((record: any, index: number) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Contract Address:</span>
                        <p className="font-mono text-white break-all">{record.contract_address}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Artwork Name:</span>
                        <p className="text-white">{record.artwork_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Artist Name:</span>
                        <p className="text-white">{record.artist_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Has Attributes:</span>
                        <p className="text-white">{record.has_attributes ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Created:</span>
                        <p className="text-white">{new Date(record.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-yellow-300">No records found in the database.</p>
            )}
            
            <div className="mt-6 p-4 bg-blue-800/30 rounded-lg">
              <h4 className="text-blue-300 font-semibold mb-2">🔧 Next Steps:</h4>
              <p className="text-blue-200 text-sm">
                If you see records with actual contract addresses (0x...) but the metadata API is looking for URL slugs (plasma-gobs-2), 
                we need to either:
              </p>
              <ul className="text-blue-200 text-sm mt-2 space-y-1">
                <li>1. Update the metadata API to handle both formats</li>
                <li>2. Create a mapping between URL slugs and contract addresses</li>
                <li>3. Update existing records to use URL slugs as keys</li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">How to Test Metadata API</h3>
          <p className="text-gray-300 mb-4">
            After checking the database, you can test the metadata API directly:
          </p>
          <div className="bg-gray-700 rounded-lg p-4">
            <code className="text-green-300">
              GET /api/metadata/editions/plasma-gobs-2/1
            </code>
            <p className="text-gray-400 text-sm mt-2">
              This should return the NFT metadata with your custom artwork and attributes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
