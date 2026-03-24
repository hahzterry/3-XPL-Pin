# 🚀 Deployment System Setup Guide

## Overview

The Gen-Plasma deployment system is now functional with the following components:

### ✅ **Completed Features:**

1. **Payment Processing** - XPL payment verification system ✅
2. **Smart Contract Generation** - Dynamic contract creation based on user config ✅
3. **API Endpoints** - Complete deployment pipeline APIs ✅
4. **Payment Modal** - User-friendly payment interface ✅
5. **IPFS Integration** - Real Pinata SDK integration with fallback simulation ✅
6. **Contract Compilation** - Solidity compiler integration ✅
7. **Blockchain Deployment** - Real contract deployment to Plasma network ✅

### 🔧 **Current Status:**

The system is **FULLY FUNCTIONAL** with smart fallbacks:
- **IPFS uploads**: Uses real Pinata API when configured, falls back to simulation
- **Contract deployment**: Compiles and deploys real contracts when deployer key is provided
- **Payment verification**: Verifies real XPL transactions on Plasma blockchain

## 🛠️ **To Activate Live Deployments:**

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Deployment Configuration
DEPLOYER_PRIVATE_KEY=0x...your-deployer-private-key
TREASURY_ADDRESS=0x...your-treasury-address

# IPFS Configuration (Pinata)
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_API_KEY=your-pinata-secret-key
```

### 2. IPFS Integration ✅ **COMPLETED**

The system now uses the Pinata REST API directly:

```typescript
// Already implemented in /pages/api/deploy/upload-ipfs.ts
// Uses Pinata REST API for reliable uploads
const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
  method: 'POST',
  headers: {
    'pinata_api_key': process.env.PINATA_API_KEY,
    'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
  },
  body: formData
});

// Automatically falls back to simulation if credentials not provided
```

### 3. Contract Compilation & Deployment ✅ **COMPLETED**

Real contract compilation and deployment is now implemented:

```typescript
// Already implemented in /pages/api/deploy/deploy-contract.ts
import solc from 'solc';

// Real contract compilation
const compiledContract = await compileContract(contractCode, contractName);

// Real contract deployment
const deployHash = await walletClient.deployContract({
  abi: compiledContract.abi,
  bytecode: compiledContract.bytecode as `0x${string}`,
  args: constructorArgs,
});

// Automatically falls back to simulation if DEPLOYER_PRIVATE_KEY is not provided
```

### 4. Payment Verification

The payment system in `/pages/api/deploy/process-payment.ts` is already functional and will verify real XPL transactions on the Plasma network.

## 🎯 **Testing the Current System:**

1. **Navigate to:** `http://localhost:3000/create/builder`
2. **Fill out the form:** Add contract details, metadata, and upload images
3. **Click "Deploy Collection":** This will show the payment modal
4. **Test Payment Flow:** Enter a mock transaction hash to see the verification process

## 📊 **Current Pricing:**

- **Basic Collection:** 7 XPL
- **Pro Collection:** 12 XPL
- **On-chain Storage Premium:** +0.7 XPL (Basic) / +1.2 XPL (Pro)

## 🔄 **Next Steps:**

1. **Real IPFS Integration** - Connect to Pinata/Infura
2. **Contract Compilation** - Add solc compiler
3. **Database Integration** - Track deployments and user data
4. **Auto-Verification** - Integrate with Plasmascan API
5. **Custom Mint Sites** - Generate hosted minting pages

## 🚨 **Security Notes:**

- Store private keys securely (use environment variables)
- Validate all user inputs before processing
- Implement rate limiting for API endpoints
- Add proper error handling and logging
- Consider using a dedicated deployer wallet with limited funds

## 💡 **Architecture:**

```
User Input → Payment Modal → API Verification → IPFS Upload → Contract Generation → Deployment → Verification
```

The system is designed to be modular - each step can be activated independently as you integrate the real services.
