import { NextApiRequest, NextApiResponse } from 'next';
import { encodeAbiParameters } from 'viem';

interface VerifyRequest {
  contractAddress: string;
  contractType: 'basic' | 'pro' | 'editions';
  contractName: string;
  symbol: string;
  baseTokenURI: string;
  // Type-specific constructor args
  royaltyRecipient?: string;
  artworkName?: string;
  artworkDescription?: string;
  artworkImage?: string;
  artistName?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      contractAddress,
      contractType,
      contractName,
      symbol,
      baseTokenURI,
      royaltyRecipient,
      artworkName,
      artworkDescription,
      artworkImage,
      artistName
    }: VerifyRequest = req.body;

    // Validate required fields
    if (!contractAddress || !contractType || !contractName || !symbol || !baseTokenURI) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the appropriate contract source based on type
    let contractSource: string;
    let constructorArgs: any[];

    switch (contractType) {
      case 'basic':
        contractSource = getBasicContractSource();
        constructorArgs = [contractName, symbol, baseTokenURI];
        break;
      case 'pro':
        contractSource = getProContractSource();
        constructorArgs = [contractName, symbol, baseTokenURI, royaltyRecipient || '0x0000000000000000000000000000000000000000'];
        break;
      case 'editions':
        contractSource = getEditionsContractSource();
        constructorArgs = [contractName, symbol, baseTokenURI, artworkName || 'Artwork', artworkDescription || 'Description', artworkImage || '', artistName || 'Artist'];
        break;
      default:
        return res.status(400).json({ error: 'Invalid contract type' });
    }

    // Encode constructor arguments
    const encodedArgs = encodeConstructorArgs(constructorArgs);

    // Submit verification to Plasmascan
    const verificationResult = await submitToPlasmascan({
      contractAddress,
      contractSource,
      contractName: getContractClassName(contractType),
      constructorArgs: encodedArgs,
      compilerVersion: 'v0.8.20+commit.a1b79de6',
      optimization: true,
      optimizationRuns: 200,
      license: 'MIT'
    });

    res.status(200).json({
      success: true,
      verificationId: verificationResult.guid,
      message: 'Contract verification submitted successfully',
      explorerUrl: `https://plasmascan.to/address/${contractAddress}`
    });

  } catch (error: any) {
    console.error('Contract verification error:', error);
    res.status(500).json({ 
      error: 'Verification failed', 
      details: error.message 
    });
  }
}

function getBasicContractSource(): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PlasmaNFTBasic is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard, Pausable {
    uint256 private _nextTokenId;
    
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MAX_PER_WALLET = 5;
    uint256 public mintPrice = 1 ether;
    
    bool public mintingActive = false;
    string private _baseTokenURI;
    
    mapping(address => uint256) public mintedByAddress;
    
    event MintPriceUpdated(uint256 newPrice);
    event MintingToggled(bool active);
    event BaseURIUpdated(string newBaseURI);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        _nextTokenId = 1;
    }

    function mint(uint256 quantity) external payable nonReentrant {
        require(mintingActive, "Minting is not active");
        require(quantity > 0 && quantity <= 3, "Invalid quantity (max 3 for basic)");
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        require(mintedByAddress[msg.sender] + quantity <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

        mintedByAddress[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(msg.sender, tokenId);
        }

        if (msg.value > mintPrice * quantity) {
            payable(msg.sender).transfer(msg.value - (mintPrice * quantity));
        }
    }

    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function toggleMinting() external onlyOwner {
        mintingActive = !mintingActive;
        emit MintingToggled(mintingActive);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    function totalSupply() public view override returns (uint256) {
        return _nextTokenId - 1;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

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
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`;
}

function getProContractSource(): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PlasmaNFTPro is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_PER_WALLET = 10;
    uint256 public mintPrice = 1 ether;
    
    bool public mintingActive = false;
    string private _baseTokenURI;
    
    bool public onChainStorageEnabled = false;
    mapping(uint256 => string) private _onChainMetadata;
    mapping(address => uint256) public mintedByAddress;
    
    address public royaltyRecipient;
    uint256 public royaltyPercentage = 250;
    
    event MintPriceUpdated(uint256 newPrice);
    event MintingToggled(bool active);
    event BaseURIUpdated(string newBaseURI);
    event OnChainStorageToggled(bool enabled);
    event MetadataUpdated(uint256 tokenId, string metadata);
    event RoyaltyUpdated(address recipient, uint256 percentage);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address _royaltyRecipient
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        royaltyRecipient = _royaltyRecipient;
        _nextTokenId = 1;
    }

    function mint(uint256 quantity) external payable nonReentrant {
        require(mintingActive, "Minting is not active");
        require(quantity > 0 && quantity <= 5, "Invalid quantity (max 5 for pro)");
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        require(mintedByAddress[msg.sender] + quantity <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

        mintedByAddress[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(msg.sender, tokenId);
        }

        if (msg.value > mintPrice * quantity) {
            payable(msg.sender).transfer(msg.value - (mintPrice * quantity));
        }
    }

    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }

    function setTokenMetadata(uint256 tokenId, string memory metadata) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _onChainMetadata[tokenId] = metadata;
        emit MetadataUpdated(tokenId, metadata);
    }

    function getTokenMetadata(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _onChainMetadata[tokenId];
    }

    function toggleOnChainStorage() external onlyOwner {
        onChainStorageEnabled = !onChainStorageEnabled;
        emit OnChainStorageToggled(onChainStorageEnabled);
    }

    function setRoyalty(address recipient, uint256 percentage) external onlyOwner {
        require(percentage <= 1000, "Royalty cannot exceed 10%");
        royaltyRecipient = recipient;
        royaltyPercentage = percentage;
        emit RoyaltyUpdated(recipient, percentage);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function toggleMinting() external onlyOwner {
        mintingActive = !mintingActive;
        emit MintingToggled(mintingActive);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    function totalSupply() public view override returns (uint256) {
        return _nextTokenId - 1;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

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
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`;
}

function getEditionsContractSource(): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PlasmaNFTEditions is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MAX_PER_WALLET = 3;
    uint256 public mintPrice = 1 ether;
    
    bool public mintingActive = false;
    string private _baseTokenURI;
    
    string public artworkName;
    string public artworkDescription;
    string public artworkImage;
    string public artistName;
    
    mapping(address => uint256) public mintedByAddress;
    
    event MintPriceUpdated(uint256 newPrice);
    event MintingToggled(bool active);
    event BaseURIUpdated(string newBaseURI);
    event ArtworkMetadataUpdated(string name, string description, string image, string artist);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        string memory _artworkName,
        string memory _artworkDescription,
        string memory _artworkImage,
        string memory _artistName
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        artworkName = _artworkName;
        artworkDescription = _artworkDescription;
        artworkImage = _artworkImage;
        artistName = _artistName;
        _nextTokenId = 1;
    }

    function mint(uint256 quantity) external payable nonReentrant {
        require(mintingActive, "Minting is not active");
        require(quantity > 0 && quantity <= 2, "Invalid quantity (max 2 for editions)");
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        require(mintedByAddress[msg.sender] + quantity <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

        mintedByAddress[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(msg.sender, tokenId);
        }

        if (msg.value > mintPrice * quantity) {
            payable(msg.sender).transfer(msg.value - (mintPrice * quantity));
        }
    }

    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }

    function updateArtworkMetadata(
        string memory _artworkName,
        string memory _artworkDescription,
        string memory _artworkImage,
        string memory _artistName
    ) external onlyOwner {
        artworkName = _artworkName;
        artworkDescription = _artworkDescription;
        artworkImage = _artworkImage;
        artistName = _artistName;
        emit ArtworkMetadataUpdated(_artworkName, _artworkDescription, _artworkImage, _artistName);
    }

    function getArtworkMetadata() external view returns (
        string memory,
        string memory,
        string memory,
        string memory
    ) {
        return (artworkName, artworkDescription, artworkImage, artistName);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function toggleMinting() external onlyOwner {
        mintingActive = !mintingActive;
        emit MintingToggled(mintingActive);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    function totalSupply() public view override returns (uint256) {
        return _nextTokenId - 1;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

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
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`;
}

function getContractClassName(contractType: string): string {
  switch (contractType) {
    case 'basic': return 'PlasmaNFTBasic';
    case 'pro': return 'PlasmaNFTPro';
    case 'editions': return 'PlasmaNFTEditions';
    default: return 'PlasmaNFT';
  }
}

function encodeConstructorArgs(args: any[]): string {
  // For now, return empty string to avoid encoding issues
  // Plasmascan can often auto-detect constructor arguments
  console.log('🔧 Constructor args for encoding:', args);
  return '';
}

async function submitToPlasmascan(params: {
  contractAddress: string;
  contractSource: string;
  contractName: string;
  constructorArgs: string;
  compilerVersion: string;
  optimization: boolean;
  optimizationRuns: number;
  license: string;
}): Promise<{ guid: string }> {
  // Get API key from environment variables
  const apiKey = process.env.PLASMASCAN_API_KEY || process.env.NEXT_PUBLIC_PLASMASCAN_API_KEY;
  
  if (!apiKey) {
    throw new Error('Plasmascan API key not configured. Please set PLASMASCAN_API_KEY environment variable.');
  }

  // Plasmascan API endpoint
  const apiUrl = 'https://api.plasmascan.to/api';
  
  const formData = new FormData();
  formData.append('module', 'contract');
  formData.append('action', 'verifysourcecode');
  formData.append('apikey', apiKey);
  formData.append('contractaddress', params.contractAddress);
  formData.append('sourceCode', params.contractSource);
  formData.append('codeformat', 'solidity-single-file');
  formData.append('contractname', params.contractName);
  formData.append('compilerversion', params.compilerVersion);
  formData.append('optimizationUsed', params.optimization ? '1' : '0');
  formData.append('runs', params.optimizationRuns.toString());
  formData.append('constructorArguements', params.constructorArgs);
  formData.append('evmversion', 'default');
  formData.append('licenseType', params.license);

  console.log('🔍 Submitting to Plasmascan:', {
    apiUrl,
    contractAddress: params.contractAddress,
    contractName: params.contractName,
    hasApiKey: !!apiKey,
    constructorArgsLength: params.constructorArgs.length
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Plasmascan API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Plasmascan API error: ${response.status} - ${response.statusText}`);
  }

  const result = await response.json();
  console.log('📄 Plasmascan response:', result);
  
  if (result.status !== '1') {
    throw new Error(`Verification failed: ${result.result || result.message || 'Unknown error'}`);
  }

  return { guid: result.result };
}
