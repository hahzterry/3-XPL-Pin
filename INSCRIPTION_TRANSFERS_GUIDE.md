# Plasma Inscriptions Transfer System

## Overview
Plasma Inscriptions now support **Ethscriptions ESIP-1 compatible transfers** with full ownership tracking and future wrapped NFT compatibility.

---

## Features

### ✅ **Implemented (Phase 1)**
- **Off-chain ownership registry** in Supabase
- **Transfer functionality** via blockchain transactions
- **Ownership validation** (only current owner can transfer)
- **Transfer history** and provenance tracking
- **ESIP-1 compatible protocol**
- **UI**: Transfer button + modal in "My Inscriptions"
- **API endpoints**: `/api/inscriptions/transfer` and `/api/inscriptions/owner`

### 🔮 **Future (Phase 2)**
- **Wrapped Inscriptions** as ERC-721 NFTs
- **Marketplace integration** (OpenSea, etc.)
- **Batch transfers** (ESIP-5 compatible)
- **Smart contract escrow** (ESIP-2 compatible)

---

## How Transfers Work

### **1. Transfer Protocol**
```
Transaction Format:
- To: Recipient address (0x...)
- Value: 0.001 XPL (proof-of-transfer)
- Data: "plasma_inscription_transfer_<original_tx_hash>"
```

### **2. Ownership Logic**
```javascript
Current Owner = Latest Transfer Recipient || Original Creator

// Query to get current owner:
SELECT to_address FROM inscription_transfers
WHERE inscription_tx_hash = '<tx_hash>'
ORDER BY created_at DESC
LIMIT 1;

// If no transfers exist, original creator is owner
```

### **3. Transfer Flow**
```
1. User clicks "📤 Transfer" on their inscription
2. Enters recipient address (0x...)
3. Confirms transfer in wallet
4. Transaction sent: 0.001 XPL + transfer data
5. API records transfer in database
6. Ownership updated automatically
7. Inscription appears in recipient's "My Inscriptions"
```

---

## Database Schema

### **inscription_transfers Table**
```sql
id                      SERIAL PRIMARY KEY
inscription_tx_hash     TEXT (references inscriptions)
from_address            TEXT
to_address              TEXT
transfer_tx_hash        TEXT UNIQUE
block_number            BIGINT
is_wrapped              BOOLEAN (future: NFT wrapping)
wrapped_token_id        BIGINT (future: NFT token ID)
wrapped_contract_address TEXT (future: wrapper contract)
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

**Indexes:**
- `inscription_tx_hash` (fast ownership lookups)
- `to_address` (find received inscriptions)
- `from_address` (find sent transfers)
- `transfer_tx_hash` (prevent duplicates)

---

## API Endpoints

### **POST /api/inscriptions/transfer**
Records a transfer after transaction confirmation.

**Request:**
```json
{
  "inscriptionTxHash": "0x...",
  "fromAddress": "0x...",
  "toAddress": "0x...",
  "transferTxHash": "0x...",
  "blockNumber": 12345
}
```

**Response:**
```json
{
  "success": true,
  "transfer": { ...transfer_data },
  "message": "Transfer recorded successfully"
}
```

**Validation:**
- Inscription must exist
- `fromAddress` must be current owner
- No duplicate `transferTxHash`

---

### **GET /api/inscriptions/owner?txHash=0x...**
Gets current owner and transfer history.

**Response:**
```json
{
  "inscriptionTxHash": "0x...",
  "currentOwner": "0x...",
  "originalCreator": "0x...",
  "createdAt": "2025-01-15T...",
  "transferCount": 3,
  "latestTransfer": { ...transfer },
  "transferHistory": [ ...all_transfers ]
}
```

---

## UI Components

### **Transfer Button**
Located in "My Inscriptions" tab, appears on hover:
```tsx
<button onClick={() => openTransferModal(inscription)}>
  📤 Transfer
</button>
```

### **Transfer Modal**
Features:
- Inscription preview (tx hash, creation date)
- Recipient address input (validated)
- Transfer details info box
- Real-time status feedback
- Confirm/Cancel buttons

---

## Future: Wrapped Inscriptions

The database is **already prepared** for Phase 2 wrapping:

### **Wrapping Flow**
```javascript
1. User owns inscription (verified via transfer table)
2. User clicks "Wrap as NFT" button
3. Smart contract mints ERC-721 token
4. Update database:
   - SET is_wrapped = true
   - SET wrapped_token_id = <token_id>
   - SET wrapped_contract_address = <contract>
5. Ownership now tracked on-chain via NFT
```

### **Benefits of Wrapping**
- ✅ Trade on NFT marketplaces (OpenSea, Blur, etc.)
- ✅ Use in DeFi (collateral, lending)
- ✅ Smart contract integrations
- ✅ Royalties and programmable rights

### **Unwrapping Flow**
```javascript
1. NFT owner clicks "Unwrap"
2. Burns NFT on-chain
3. Update database:
   - SET is_wrapped = false
   - SET wrapped_token_id = NULL
4. Ownership returns to off-chain registry
5. Transfer via original protocol
```

---

## Example Use Cases

### **1. Artist Sale**
```
Artist → Creates inscription
Artist → Transfers to Collector
Collector → Views in "My Inscriptions"
```

### **2. Gift/Trade**
```
User A → Owns inscription
User A → Transfers to User B
User B → Owns inscription (free to transfer again)
```

### **3. Future Marketplace**
```
User → Wraps inscription as NFT
User → Lists on OpenSea
Buyer → Purchases NFT
NFT → Auto-transfers on-chain
Buyer → Can unwrap back to inscription
```

---

## Testing Checklist

- [ ] Create inscription from wallet A
- [ ] Verify wallet A owns inscription (API check)
- [ ] Transfer to wallet B
- [ ] Verify wallet B now owns inscription
- [ ] Try to transfer from wallet A (should fail - not owner)
- [ ] Check transfer history (should show A → B)
- [ ] Transfer from B to C
- [ ] Verify C is current owner

---

## Compatibility

### **Ethscriptions Protocol**
- ✅ ESIP-1: Smart Contract Ethscription Transfers
- 🔜 ESIP-2: Safe Trustless Smart Contract Escrow
- 🔜 ESIP-5: Bulk Ethscription Transfers from EOAs

### **Plasma Chain**
- ✅ Native XPL transactions
- ✅ Plasmascan.to integration
- ✅ EVM-compatible smart contracts (future)

---

## Security Considerations

1. **Ownership Validation**: Only current owner can transfer
2. **Duplicate Prevention**: Unique constraint on `transfer_tx_hash`
3. **Immutable History**: Transfers are append-only (no deletions)
4. **Address Validation**: All addresses must be valid 0x... format
5. **Blockchain Proof**: Every transfer requires on-chain transaction

---

## Support & Documentation

- **Ethscriptions Docs**: https://docs.ethscriptions.com/esips/accepted-esips
- **Plasma Chain**: https://plasma.to
- **Plasmascan**: https://plasmascan.to

---

**Status**: ✅ Production Ready (Phase 1)  
**Last Updated**: January 2025  
**Database**: Supabase (inscription_transfers table created)  
**Blockchain**: Plasma Mainnet Beta

