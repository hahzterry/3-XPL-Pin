'use client';

import { useState } from 'react';
import { CheckCircle, ExternalLink, Copy, Check, Eye, EyeOff } from 'lucide-react';

interface DeploymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  deploymentData: {
    contractAddress: string;
    transactionHash: string;
    contractName: string;
    network: string;
    gasUsed: string;
    deploymentCost: string;
    paymentTransactionHash?: string;
    explorerUrl: string;
    contractType: 'basic' | 'pro' | 'editions';
    verificationResult?: {
      success: boolean;
      verificationId?: string;
      message?: string;
      explorerUrl?: string;
      note?: string;
      commands?: {
        scriptCommand?: string;
        directCommand?: string;
      };
    };
  };
}

export default function DeploymentSuccessModal({ 
  isOpen, 
  onClose, 
  deploymentData 
}: DeploymentSuccessModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [showPrivateInfo, setShowPrivateInfo] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, type: 'address' | 'txHash') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedTxHash(true);
        setTimeout(() => setCopiedTxHash(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getContractTypeInfo = (type: string) => {
    switch (type) {
      case 'basic':
        return {
          name: 'Basic Collection',
          description: 'Standard NFT collection with basic minting functionality',
          features: ['Minting', 'Owner controls', 'Withdrawal']
        };
      case 'pro':
        return {
          name: 'Pro Collection',
          description: 'Advanced NFT collection with additional features',
          features: ['All Basic features', 'Royalties', 'Metadata updates', 'Pausable minting']
        };
      case 'editions':
        return {
          name: 'Editions Collection',
          description: 'Special edition collection with shared metadata',
          features: ['All Pro features', 'Shared metadata', 'Edition-specific functions']
        };
      default:
        return {
          name: 'Custom Collection',
          description: 'Customized NFT collection',
          features: ['Custom features']
        };
    }
  };

  const contractInfo = getContractTypeInfo(deploymentData.contractType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Deployment Successful!</h2>
                <p className="text-green-100">Your NFT collection is now live on Plasma</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contract Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Collection Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300">Collection Name</label>
                <p className="font-medium text-white">{deploymentData.contractName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-300">Type</label>
                <p className="font-medium text-white">{contractInfo.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-300">Network</label>
                <p className="font-medium text-white capitalize">{deploymentData.network}</p>
              </div>
              <div>
                <label className="text-sm text-gray-300">Deployment Cost</label>
                <p className="font-medium text-white">{deploymentData.deploymentCost} XPL</p>
              </div>
            </div>
          </div>

          {/* Contract Address */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Contract Address</h3>
              <button
                onClick={() => copyToClipboard(deploymentData.contractAddress, 'address')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                {copiedAddress ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-sm bg-gray-800 text-white p-2 rounded border border-gray-600 break-all">
              {deploymentData.contractAddress}
            </p>
            <a
              href={deploymentData.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mt-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">View on Explorer</span>
            </a>
          </div>

          {/* Payment Transaction */}
          {deploymentData.paymentTransactionHash && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">Payment Transaction</h3>
                <span className="text-sm text-white bg-gray-700 px-2 py-1 rounded">
                  {deploymentData.deploymentCost} XPL Paid
                </span>
              </div>
              <p className="font-mono text-sm bg-gray-700 text-white p-2 rounded border border-gray-600 break-all">
                {deploymentData.paymentTransactionHash}
              </p>
              <p className="text-sm text-gray-300 mt-2">
                ✅ Payment verified and processed successfully
              </p>
            </div>
          )}

          {/* Deployment Transaction Hash */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Deployment Transaction</h3>
              <button
                onClick={() => copyToClipboard(deploymentData.transactionHash, 'txHash')}
                className="flex items-center space-x-2 text-gray-300 hover:text-gray-200 transition-colors"
              >
                {copiedTxHash ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-sm bg-gray-700 text-white p-2 rounded border border-gray-600 break-all">
              {deploymentData.transactionHash}
            </p>
          </div>

          {/* Features */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Collection Features</h3>
            <p className="text-gray-300 mb-3">{contractInfo.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {contractInfo.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contract Verification Status */}
          {deploymentData.verificationResult && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Contract Verification</h3>
              <div className="space-y-2">
                {deploymentData.verificationResult.success ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-white">
                        {deploymentData.verificationResult.message || 'Contract verification prepared successfully'}
                      </span>
                    </div>
                    
                    {deploymentData.verificationResult.note && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-sm text-blue-300 mb-2">{deploymentData.verificationResult.note}</p>
                        {deploymentData.verificationResult.commands && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-400">Manual verification command:</p>
                            <code className="text-xs bg-black/20 p-2 rounded block text-green-300 break-all">
                              {deploymentData.verificationResult.commands.scriptCommand || deploymentData.verificationResult.commands.directCommand}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {deploymentData.verificationResult.verificationId && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-300">Verification ID:</span>
                        <span className="text-sm text-white font-mono">{deploymentData.verificationResult.verificationId}</span>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-300">
                      {deploymentData.verificationResult.note 
                        ? 'Use the command above to verify your contract manually, or check Plasmascan for automatic verification status.'
                        : 'Your contract is being verified on Plasmascan. This may take a few minutes.'
                      }
                    </p>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-yellow-300">Contract verification failed</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Access Control Info */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Access Control</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-white">Mint page created automatically</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-white">
                  {deploymentData.contractType === 'basic' && 'Basic minting functionality available'}
                  {deploymentData.contractType === 'pro' && 'Advanced features available (royalties, pausing)'}
                  {deploymentData.contractType === 'editions' && 'Edition-specific features available'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <a
              href={`/mint/${deploymentData.contractAddress}`}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold text-center transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-5 w-5" />
              <span>Go to Mint Page</span>
            </a>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
