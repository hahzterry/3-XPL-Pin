import { requireApiKey } from '../_auth'
import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http, parseEther, formatEther } from 'viem';

// Create a public client for the Plasma network
const publicClient = createPublicClient({
  chain: {
    id: 9745,
    name: 'Plasma',
    network: 'plasma',
    nativeCurrency: {
      decimals: 18,
      name: 'Plasma',
      symbol: 'XPL',
    },
    rpcUrls: {
      public: { http: ['https://rpc.plasma.to'] },
      default: { http: ['https://rpc.plasma.to'] },
    },
    blockExplorers: {
      default: { name: 'PlasmaExplorer', url: 'https://plasmaexplorer.io' },
    },
  },
  transport: http('https://rpc.plasma.to'),
});

interface PaymentRequest {
  userAddress: string;
  amount: number; // Amount in XPL
  transactionHash: string;
  deploymentId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!requireApiKey(req, res)) return

  try {
    const { userAddress, amount, transactionHash, deploymentId } = req.body as PaymentRequest;

    // Debug logging
    console.log('Payment verification request received:', {
      userAddress,
      amount,
      transactionHash,
      deploymentId,
      userAddressType: typeof userAddress,
      amountType: typeof amount,
      transactionHashType: typeof transactionHash,
      deploymentIdType: typeof deploymentId
    });

    // Validate required fields
    if (!userAddress || !amount || !transactionHash || !deploymentId) {
      console.log('Validation failed - missing fields:', {
        hasUserAddress: !!userAddress,
        hasAmount: !!amount,
        hasTransactionHash: !!transactionHash,
        hasDeploymentId: !!deploymentId
      });
      return res.status(400).json({ 
        error: 'Missing required fields: userAddress, amount, transactionHash, deploymentId' 
      });
    }

    // Validate transaction hash format
    if (!transactionHash.startsWith('0x') || transactionHash.length !== 66) {
      return res.status(400).json({ error: 'Invalid transaction hash format' });
    }

    // Verify blockchain transaction
    console.log(`Verifying payment transaction: ${transactionHash}`);
    
    const transaction = await publicClient.getTransaction({
      hash: transactionHash as `0x${string}`
    });

    if (!transaction) {
      return res.status(400).json({ error: 'Transaction not found' });
    }

    // CRITICAL: Verify transaction recipient is the treasury
    const treasuryAddress = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x36d7885524c591eda18Cf678b49a09772E89dB5c').toLowerCase();
    const transactionTo = transaction.to?.toLowerCase();
    
    if (transactionTo !== treasuryAddress) {
      return res.status(400).json({ 
        error: `Payment must be sent to treasury address: ${treasuryAddress}. Received: ${transactionTo}` 
      });
    }

    // CRITICAL: Verify transaction sender is the user
    const transactionFrom = transaction.from.toLowerCase();
    if (transactionFrom !== userAddress.toLowerCase()) {
      return res.status(400).json({ 
        error: `Transaction must be from your wallet address: ${userAddress}. Received from: ${transactionFrom}` 
      });
    }

    // Verify transaction details
    const expectedAmount = parseEther(amount.toString());
    const actualAmount = transaction.value;

    if (actualAmount < expectedAmount) {
      return res.status(400).json({ 
        error: `Insufficient payment. Expected: ${amount} XPL, Received: ${formatEther(actualAmount)} XPL` 
      });
    }

    // Verify the transaction is confirmed
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`
    });

    if (!receipt) {
      return res.status(400).json({ error: 'Transaction not confirmed yet' });
    }

    if (receipt.status !== 'success') {
      return res.status(400).json({ error: 'Transaction failed' });
    }

    // Get current block to check confirmations
    const currentBlock = await publicClient.getBlockNumber();
    const confirmations = Number(currentBlock - receipt.blockNumber);

    if (confirmations < 1) {
      return res.status(400).json({ 
        error: `Transaction needs more confirmations. Current: ${confirmations}, Required: 1` 
      });
    }

    // CRITICAL: Verify transaction is recent (within last 24 hours)
    const transactionBlock = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
    const transactionTime = Number(transactionBlock.timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    const ageInHours = (currentTime - transactionTime) / 3600;
    
    if (ageInHours > 24) {
      return res.status(400).json({ 
        error: `Transaction is too old (${Math.floor(ageInHours)} hours). Payment must be made within the last 24 hours.` 
      });
    }

    // CRITICAL: Check if transaction hash has already been used
    const { supabase } = await import('@/lib/supabase');
    
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('transaction_hash')
      .eq('transaction_hash', transactionHash.toLowerCase())
      .single();
    
    if (existingPayment) {
      return res.status(400).json({ 
        error: 'This transaction has already been used for a previous deployment.' 
      });
    }

    // Store payment record in database to prevent reuse
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        deployment_id: deploymentId,
        user_address: userAddress.toLowerCase(),
        amount: amount.toString(),
        transaction_hash: transactionHash.toLowerCase(),
        verified_at: new Date().toISOString(),
        block_number: receipt.blockNumber.toString(),
        confirmations: Number(confirmations)
      });

    if (insertError) {
      console.error('❌ Error storing payment record:', insertError);
      // Don't fail the verification if database insert fails, but log it
    }

    console.log(`✅ Payment verified successfully:`, {
      deploymentId,
      userAddress,
      amount,
      transactionHash,
      confirmations: Number(confirmations),
      blockNumber: receipt.blockNumber.toString(),
      ageInHours: Math.floor(ageInHours)
    });
    
    res.status(200).json({
      success: true,
      verified: true,
      amount: amount.toString(),
      confirmations: Number(confirmations),
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('Transaction not found')) {
      return res.status(400).json({ error: 'Transaction not found or not yet mined' });
    }
    
    if (errorMessage.includes('network')) {
      return res.status(503).json({ error: 'Network error, please try again' });
    }

    res.status(500).json({ error: 'Failed to verify payment' });
  }
}

// Helper function to generate payment address (treasury)
export function getPaymentAddress(): string {
  return process.env.TREASURY_ADDRESS || '0x36d7885524c591eda18Cf678b49a09772E89dB5c';
}

// Helper function to calculate deployment fee
export function calculateDeploymentFee(
  tierType: 'basic' | 'pro',
  storageType: 'ipfs' | 'onchain'
): number {
  const baseFee = tierType === 'basic' ? 7 : 12;
  const storageFee = storageType === 'onchain' ? (tierType === 'basic' ? 0.7 : 1.2) : 0;
  return baseFee + storageFee;
}
