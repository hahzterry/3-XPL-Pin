'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (transactionHash: string) => void;
  amount: number;
  contractType: string;
  treasuryAddress: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentComplete,
  amount,
  contractType,
  treasuryAddress
}: PaymentModalProps) {
  const { address } = useAccount();
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>();
  
  // Send transaction hook with callbacks
  const { 
    sendTransaction,
    isLoading: isSending,
    isError: isSendError,
    error: sendError,
    reset: resetSend
  } = useSendTransaction({
    onSuccess(data) {
      setCurrentTxHash(data.hash);
      setPaymentStatus('⏳ Transaction sent! Waiting for confirmation...');
    },
    onError(error) {
      setPaymentStatus(`❌ Transaction failed: ${error.message}`);
    }
  });
  
  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    isError: isConfirmError
  } = useWaitForTransaction({
    hash: currentTxHash,
    onSuccess() {
      if (currentTxHash) {
        verifyPayment(currentTxHash);
      }
    },
    onError() {
      setPaymentStatus('❌ Transaction confirmation failed');
    }
  });
  
  const handleSendPayment = () => {
    if (!address) {
      setPaymentStatus('❌ Please connect your wallet');
      return;
    }
    
    setPaymentStatus('💳 Sending payment...');
    
    sendTransaction({
      to: treasuryAddress as `0x${string}`,
      value: parseEther(amount.toString()),
    });
  };
  
  const verifyPayment = async (txHash: string) => {
    setPaymentStatus('🔍 Verifying payment...');
    
    try {
      const response = await fetch('/api/deploy/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          amount: amount,
          transactionHash: txHash,
          deploymentId: `deploy-${Date.now()}`
        })
      });

      const result = await response.json();

      if (result.success && result.verified) {
        setPaymentStatus('✅ Payment verified successfully!');
        setTimeout(() => {
          onPaymentComplete(txHash);
          handleClose();
        }, 1500);
      } else {
        setPaymentStatus(`❌ Verification failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setPaymentStatus(`❌ Verification error: ${error.message}`);
    }
  };

  const handleClose = () => {
    setPaymentStatus('');
    setCurrentTxHash(undefined);
    resetSend();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Payment Required</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              {contractType.charAt(0).toUpperCase() + contractType.slice(1)} Collection Deployment
            </h3>
            <div className="text-3xl font-bold text-forest-300 mb-2">
              {amount} XPL
            </div>
            <p className="text-gray-400 text-sm">
              Click "Send Payment" to deploy your collection
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Treasury Address:
            </label>
            <div className="bg-gray-800 rounded-lg p-3">
              <code className="text-forest-300 text-xs break-all">
                {treasuryAddress}
              </code>
            </div>
          </div>

          {currentTxHash && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Transaction Hash:
              </label>
              <div className="bg-gray-800 rounded-lg p-3">
                <code className="text-blue-300 text-xs break-all">
                  {currentTxHash}
                </code>
              </div>
              <a
                href={`https://plasmascan.to/tx/${currentTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-forest-400 hover:text-forest-300 transition-colors inline-block"
              >
                🔗 View on PlasmaExplorer
              </a>
            </div>
          )}

          {paymentStatus && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              paymentStatus.includes('✅') 
                ? 'bg-green-900/50 text-green-300 border border-green-700' 
                : paymentStatus.includes('❌')
                ? 'bg-red-900/50 text-red-300 border border-red-700'
                : 'bg-blue-900/50 text-blue-300 border border-blue-700'
            }`}>
              {paymentStatus}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSending || isConfirming}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSendPayment}
              disabled={isSending || isConfirming || isConfirmed}
              className="flex-1 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSending ? '💳 Sending...' : 
               isConfirming ? '⏳ Confirming...' : 
               isConfirmed ? '✅ Paid!' : 
               '💰 Send Payment'}
            </button>
          </div>

          <div className="text-xs text-gray-500 space-y-1 bg-gray-800/50 rounded-lg p-3">
            <p className="font-semibold text-gray-400 mb-1">How it works:</p>
            <p>• Click "Send Payment" to open your wallet</p>
            <p>• Confirm the {amount} XPL transaction</p>
            <p>• Wait for blockchain confirmation (~2-5 seconds)</p>
            <p>• Payment verified automatically</p>
            <p>• Your contract deploys immediately!</p>
          </div>
        </div>
      </div>
    </div>
  );
}