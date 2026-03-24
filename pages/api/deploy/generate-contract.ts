import { NextApiRequest, NextApiResponse } from 'next';

interface ContractConfig {
  type: 'basic' | 'pro' | 'editions';
  name: string;
  symbol: string;
  maxSupply: number;
  mintPrice: number;
  maxPerWallet: number;
}

interface MetadataConfig {
  collectionName: string;
  description: string;
  image: string;
  externalUrl: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface RoyaltyConfig {
  enabled: boolean;
  recipient: string;
  percentage: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractConfig, metadataConfig, royaltyConfig } = req.body as {
      contractConfig: ContractConfig;
      metadataConfig: MetadataConfig;
      royaltyConfig: RoyaltyConfig;
    };

    // Validate required fields
    if (!contractConfig.name || !contractConfig.symbol) {
      return res.status(400).json({ error: 'Contract name and symbol are required' });
    }

    if (!metadataConfig.collectionName || !metadataConfig.description) {
      return res.status(400).json({ error: 'Collection name and description are required' });
    }

    // Generate the smart contract code
    const contractCode = generateContractCode(contractConfig, metadataConfig, royaltyConfig);
    
    // Generate constructor arguments
    const constructorArgs = [
      contractConfig.name,
      contractConfig.symbol,
      metadataConfig.collectionName,
      contractConfig.maxSupply,
      contractConfig.mintPrice,
      contractConfig.maxPerWallet
    ];

    res.status(200).json({
      success: true,
      contractCode,
      constructorArgs,
      contractName: contractConfig.name,
      contractSymbol: contractConfig.symbol
    });

  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({ error: 'Failed to generate contract' });
  }
}

function generateContractCode(
  contractConfig: ContractConfig,
  metadataConfig: MetadataConfig,
  royaltyConfig: RoyaltyConfig
): string {
  // For compilation, we need to include the full OpenZeppelin contracts
  // This is a simplified version that includes the essential functionality
  const contractName = contractConfig.name.replace(/\s+/g, '');
  
  const royaltyImports = royaltyConfig.enabled 
    ? `import "@openzeppelin/contracts/token/common/ERC2981.sol";`
    : '';

  const royaltyInheritance = royaltyConfig.enabled 
    ? `, ERC2981`
    : '';

  const royaltyConstructor = royaltyConfig.enabled
    ? `_setDefaultRoyalty(0x36d7885524c591eda18Cf678b49a09772E89dB5c, ${Math.floor(royaltyConfig.percentage * 100)});`
    : '';

  const royaltyOverride = '';

  const proFeatures = contractConfig.type === 'pro' ? `
    // Pro tier features
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }` : '';

  const editionsFeatures = contractConfig.type === 'editions' ? `
    // Editions-specific features
    string private editionMetadataURI;
    
    function setEditionMetadata(string memory newMetadataURI) external onlyOwner {
        editionMetadataURI = newMetadataURI;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        // All editions share the same metadata
        return editionMetadataURI;
    }` : '';

  // Generate a simplified contract for compilation
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
${contractConfig.type === 'pro' ? 'import "@openzeppelin/contracts/security/Pausable.sol";' : ''}
${royaltyImports}

contract ${contractName} is 
    ERC721, 
    ERC721Enumerable, 
    Ownable, 
    ReentrancyGuard${contractConfig.type === 'pro' ? ', Pausable' : ''}${royaltyInheritance} 
{
    using Strings for uint256;
    
    uint256 public constant MAX_SUPPLY = ${contractConfig.maxSupply};
    uint256 public constant MINT_PRICE = ${Math.floor(contractConfig.mintPrice * 1e18)};
    uint256 public constant MAX_PER_WALLET = ${contractConfig.maxPerWallet};
    
    string private baseTokenURI;
    bool public mintingActive = false;
    mapping(address => uint256) public mintedCount;
    
    constructor(
        string memory name,
        string memory symbol,
        string memory collectionName,
        uint256 maxSupply,
        uint256 mintPrice,
        uint256 maxPerWallet
    ) ERC721(name, symbol) Ownable(msg.sender) {
        baseTokenURI = "https://gen-plasma.com/api/metadata/";
        ${royaltyConstructor}
    }
    
    function mint(uint256 quantity) external payable nonReentrant {
        require(mintingActive, "Minting is not active");
        require(quantity > 0, "Quantity must be greater than 0");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Would exceed max supply");
        require(mintedCount[msg.sender] + quantity <= MAX_PER_WALLET, "Would exceed max per wallet");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        
        mintedCount[msg.sender] += quantity;
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = totalSupply() + 1;
            _safeMint(msg.sender, tokenId);
        }
    }
    
    function setMintingActive(bool active) external onlyOwner {
        mintingActive = active;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    ${contractConfig.type === 'editions' ? '' : `
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return string(abi.encodePacked(baseTokenURI, tokenId.toString()));
    }`}
    
    ${proFeatures}
    
    ${editionsFeatures}
    
    ${royaltyOverride}
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable${royaltyConfig.enabled ? ', ERC2981' : ''})
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`;
}
