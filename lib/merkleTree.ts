import { solidityPackedKeccak256 } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import { keccak256 as keccakBuffer } from 'js-sha3';

// Helper function for hashing addresses
const hashAddress = (address: string): Buffer => {
  return Buffer.from(keccakBuffer(address.toLowerCase()), 'hex');
};

/**
 * Generate a Merkle tree from an array of addresses
 * @param addresses - Array of Ethereum addresses
 * @returns MerkleTree instance and root hash
 */
export function generateMerkleTree(addresses: string[]): {
  tree: MerkleTree;
  root: string;
} {
  // Convert addresses to lowercase and create leaf nodes
  const leaves = addresses.map(addr => hashAddress(addr));

  // Create Merkle tree using keccak256 from js-sha3
  const tree = new MerkleTree(leaves, (data: Buffer | string) => Buffer.from(keccakBuffer(data), 'hex'), { 
    sortPairs: true 
  });

  // Get root hash
  const root = tree.getHexRoot();

  return { tree, root };
}

/**
 * Generate a Merkle proof for a specific address
 * @param address - The address to generate proof for
 * @param addresses - All addresses in the whitelist
 * @returns Hex proof array
 */
export function generateMerkleProof(
  address: string,
  addresses: string[]
): string[] {
  const { tree } = generateMerkleTree(addresses);
  const leaf = hashAddress(address);
  const proof = tree.getHexProof(leaf);
  
  return proof;
}

/**
 * Verify a Merkle proof
 * @param address - Address to verify
 * @param proof - Merkle proof
 * @param root - Merkle root
 * @returns true if proof is valid
 */
export function verifyMerkleProof(
  address: string,
  proof: string[],
  root: string
): boolean {
  const leaf = hashAddress(address);
  const tree = new MerkleTree([], (data: Buffer | string) => Buffer.from(keccakBuffer(data), 'hex'), { sortPairs: true });
  
  return tree.verify(proof, leaf, root);
}

/**
 * Format addresses for Merkle tree generation
 * Ensures all addresses are lowercase and properly formatted
 */
export function formatAddressesForMerkle(addresses: string[]): string[] {
  return addresses
    .filter(addr => addr && addr.startsWith('0x'))
    .map(addr => addr.toLowerCase());
}

/**
 * Get Merkle tree statistics
 */
export function getMerkleTreeStats(addresses: string[]): {
  totalAddresses: number;
  treeDepth: number;
  rootHash: string;
} {
  const { tree, root } = generateMerkleTree(addresses);
  const depth = tree.getDepth();
  
  return {
    totalAddresses: addresses.length,
    treeDepth: depth,
    rootHash: root
  };
}
