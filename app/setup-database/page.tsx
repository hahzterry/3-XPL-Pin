'use client';

import { useState } from 'react';

export default function SetupDatabasePage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isDisablingRLS, setIsDisablingRLS] = useState(false);
  const [isCreatingTempUploads, setIsCreatingTempUploads] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [rlsResult, setRlsResult] = useState<any>(null);
  const [tempUploadsResult, setTempUploadsResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [rlsError, setRlsError] = useState<string | null>(null);
  const [tempUploadsError, setTempUploadsError] = useState<string | null>(null);

  const createTables = async () => {
    setIsCreating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/setup/create-database-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to create tables');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsCreating(false);
    }
  };

  const disableRLS = async () => {
    setIsDisablingRLS(true);
    setRlsError(null);
    setRlsResult(null);

    try {
      const response = await fetch('/api/setup/disable-rls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setRlsResult(data);
      } else {
        setRlsError(data.error || 'Failed to disable RLS');
      }
    } catch (err: any) {
      setRlsError(err.message || 'Network error');
    } finally {
      setIsDisablingRLS(false);
    }
  };

  const createTempUploadsTable = async () => {
    setIsCreatingTempUploads(true);
    setTempUploadsError(null);
    setTempUploadsResult(null);

    try {
      const response = await fetch('/api/setup/create-temp-uploads-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTempUploadsResult(data);
      } else {
        setTempUploadsError(data.error || 'Failed to create temp uploads table');
      }
    } catch (err: any) {
      setTempUploadsError(err.message || 'Network error');
    } finally {
      setIsCreatingTempUploads(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">
              Database Setup
            </h1>
            
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-300 mb-2">
                  Create Database Tables
                </h2>
                <p className="text-gray-300 text-sm">
                  This will create the <code className="bg-gray-800 px-2 py-1 rounded">basic_artwork</code> and{' '}
                  <code className="bg-gray-800 px-2 py-1 rounded">pro_artwork</code> tables in your Supabase database.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={createTables}
                  disabled={isCreating}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    isCreating
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-forest-500 hover:bg-forest-600 text-white'
                  }`}
                >
                  {isCreating ? 'Creating Tables...' : 'Create Database Tables'}
                </button>

                <button
                  onClick={disableRLS}
                  disabled={isDisablingRLS}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    isDisablingRLS
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {isDisablingRLS ? 'Disabling RLS...' : 'Disable RLS (Fix Existing Tables)'}
                </button>

                <button
                  onClick={createTempUploadsTable}
                  disabled={isCreatingTempUploads}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    isCreatingTempUploads
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  {isCreatingTempUploads ? 'Creating Table...' : 'Create Temp Uploads Table'}
                </button>
              </div>

              {result && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">
                    ✅ Tables Created Successfully!
                  </h3>
                  <pre className="text-green-200 text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}

              {rlsResult && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">
                    ✅ RLS Disabled Successfully!
                  </h3>
                  <pre className="text-green-200 text-sm overflow-auto">
                    {JSON.stringify(rlsResult, null, 2)}
                  </pre>
                </div>
              )}

              {tempUploadsResult && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">
                    ✅ Temp Uploads Table Created Successfully!
                  </h3>
                  <pre className="text-green-200 text-sm overflow-auto">
                    {JSON.stringify(tempUploadsResult, null, 2)}
                  </pre>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-300 mb-2">
                    ❌ Table Creation Error
                  </h3>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {rlsError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-300 mb-2">
                    ❌ RLS Disable Error
                  </h3>
                  <p className="text-red-200 text-sm">{rlsError}</p>
                </div>
              )}

              {tempUploadsError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-300 mb-2">
                    ❌ Temp Uploads Table Creation Error
                  </h3>
                  <p className="text-red-200 text-sm">{tempUploadsError}</p>
                </div>
              )}

              <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  What this creates:
                </h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• <code>basic_artwork</code> table for Basic contract NFT items</li>
                  <li>• <code>pro_artwork</code> table for Pro contract NFT items</li>
                  <li>• <code>temp_uploads</code> table for temporary file storage</li>
                  <li>• Proper indexes for performance</li>
                  <li>• Row Level Security (RLS) policies</li>
                  <li>• Unique constraints on contract_address + token_id</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
