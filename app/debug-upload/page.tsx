'use client';

import { useState } from 'react';

export default function DebugUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Debug: File selected:', file.name, file.type, file.size);

      // Use FormData for large files to avoid size limits
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contractAddress', 'debug-test');
      formData.append('metadata', JSON.stringify({
        testUpload: true,
        originalName: file.name,
        fileSize: file.size
      }));

      console.log('✅ Debug: FormData created, testing upload...');

      // Test the simple upload API
      const response = await fetch('/api/storage/upload-simple', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResults(data);
      console.log('✅ Debug: Upload successful:', data);

    } catch (err: any) {
      setError(err.message);
      console.error('❌ Debug: Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            🔍 Debug Image Upload
          </h1>

          <div className="text-center mb-8">
            <div className="border-2 border-dashed border-white/30 rounded-lg p-8">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 disabled:opacity-50"
              />
              <p className="text-gray-300 mt-4">
                {uploading ? '🔄 Uploading...' : 'Select an image file to test upload'}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <h3 className="text-red-300 font-semibold mb-2">❌ Upload Failed</h3>
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {results && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
              <h3 className="text-green-300 font-semibold mb-4 text-xl">
                ✅ Upload Successful!
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">📊 Upload Results:</h4>
                  <div className="bg-black/20 rounded p-3">
                    <pre className="text-green-200 text-sm overflow-auto">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </div>
                </div>

                {results.tempUrl && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">🖼️ Uploaded Image:</h4>
                    <div className="bg-black/20 rounded p-3">
                      <img 
                        src={results.tempUrl} 
                        alt="Uploaded test image"
                        className="max-w-xs rounded-lg"
                        onError={(e) => {
                          console.error('Image load error:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <p className="text-green-200 text-sm mt-2 break-all">
                        {results.tempUrl}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">📁 File Info:</h4>
                    <div className="bg-black/20 rounded p-3">
                      <p className="text-green-200 text-sm">Size: {results.size} bytes</p>
                      <p className="text-green-200 text-sm">Filename: {results.filename}</p>
                      <p className="text-green-200 text-sm">Expires: {new Date(results.expiresAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center space-x-4">
            <a
              href="/test-storage"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              ← Back to Storage Test
            </a>
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
