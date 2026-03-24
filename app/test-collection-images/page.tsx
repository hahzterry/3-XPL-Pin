'use client';

import { useState } from 'react';

export default function TestCollectionImages() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testContract, setTestContract] = useState('0x1234567890123456789012345678901234567890');

  const checkCollectionImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/check-collection-images');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check collection images', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testInsert = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/insert-test-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractAddress: testContract }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to test insert', details: error });
    } finally {
      setLoading(false);
    }
  };

  const showRLSFixInstructions = () => {
    setResult({
      instructions: 'To fix the RLS policies, run this SQL in your Supabase SQL Editor:',
      sql: `-- Fix RLS policies to allow anonymous users to insert collection images
DROP POLICY IF EXISTS "public can read collection_images" ON collection_images;
DROP POLICY IF EXISTS "public can insert collection_images" ON collection_images;

CREATE POLICY "public can read collection_images" ON collection_images FOR SELECT TO anon USING (true);
CREATE POLICY "public can insert collection_images" ON collection_images FOR INSERT TO anon WITH CHECK (true);`,
      note: 'Copy and paste this SQL into your Supabase SQL Editor and run it to fix the permission issue.'
    });
  };

  const showForeignKeyFixInstructions = () => {
    setResult({
      instructions: 'To fix the foreign key constraint issue, run this SQL in your Supabase SQL Editor:',
      sql: `-- Fix the foreign key constraint issue for collection_images
-- The constraint is preventing inserts because contracts might not exist in the contracts table yet

-- Remove the foreign key constraint entirely
ALTER TABLE collection_images DROP CONSTRAINT IF EXISTS collection_images_contract_address_fkey;

-- Verify the constraint is removed
SELECT 'Foreign key constraint removed successfully' as status;`,
      note: 'This removes the foreign key constraint that requires contracts to exist before uploading images.'
    });
  };

  const showMintBannersTableSetup = () => {
    setResult({
      instructions: 'To create the mint_banners table, run this SQL in your Supabase SQL Editor:',
      sql: `-- Create mint_banners table for storing mint page banner images
CREATE TABLE IF NOT EXISTS mint_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mint_banners_contract ON mint_banners(contract_address);
CREATE INDEX IF NOT EXISTS idx_mint_banners_uploaded ON mint_banners(uploaded_at);

-- Enable Row Level Security
ALTER TABLE mint_banners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow public read and insert access)
DROP POLICY IF EXISTS "public can read mint_banners" ON mint_banners;
DROP POLICY IF EXISTS "public can insert mint_banners" ON mint_banners;

CREATE POLICY "public can read mint_banners" ON mint_banners FOR SELECT TO anon USING (true);
CREATE POLICY "public can insert mint_banners" ON mint_banners FOR INSERT TO anon WITH CHECK (true);

-- Verify the table was created
SELECT 'mint_banners table created successfully' as status;`,
      note: 'This creates the mint_banners table needed for the mint page banner system.'
    });
  };

  const debugCollectionMetadata = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/debug-collection-metadata?contractAddress=${testContract}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to debug collection metadata', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testCollectionMetadataAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/test-collection-metadata?contractAddress=${testContract}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to test collection metadata API', details: error });
    } finally {
      setLoading(false);
    }
  };

  const checkMintBannersTable = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/check-mint-banners-table');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check mint banners table', details: error });
    } finally {
      setLoading(false);
    }
  };

  const checkMetadataImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/check-metadata-images?contractAddress=${testContract}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check metadata images', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testMetadataAPIDirect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/test-metadata-api-direct?contractAddress=${testContract}&tokenId=5`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to test metadata API directly', details: error });
    } finally {
      setLoading(false);
    }
  };

  const checkContractBaseURI = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/check-contract-base-uri?contractAddress=${testContract}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check contract base URI', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Collection Images Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={checkCollectionImages}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Checking...' : 'Check Collection Images'}
          </button>
          
          <div className="flex space-x-4 items-center">
            <input
              type="text"
              value={testContract}
              onChange={(e) => setTestContract(e.target.value)}
              placeholder="Contract address for test"
              className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 flex-1"
            />
            <button
              onClick={testInsert}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Testing...' : 'Test Insert'}
            </button>
            
            <button
              onClick={debugCollectionMetadata}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Debugging...' : 'Debug Collection Metadata'}
            </button>
            
            <button
              onClick={testCollectionMetadataAPI}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Testing...' : 'Test Collection Metadata API'}
            </button>
            
            <button
              onClick={checkMintBannersTable}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Checking...' : 'Check Mint Banners Table'}
            </button>
            
            <button
              onClick={checkMetadataImages}
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Checking...' : 'Check Metadata Images'}
            </button>
            
            <button
              onClick={testMetadataAPIDirect}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Testing...' : 'Test Metadata API Direct'}
            </button>
            
            <button
              onClick={checkContractBaseURI}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Checking...' : 'Check Contract Base URI'}
            </button>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={showRLSFixInstructions}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Show RLS Fix Instructions
            </button>
            
            <button
              onClick={showForeignKeyFixInstructions}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Show Foreign Key Fix Instructions
            </button>
            
            <button
              onClick={showMintBannersTableSetup}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Show Mint Banners Table Setup
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Results:</h2>
            <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
