import { requireApiKey } from '../_auth'
import { NextApiRequest, NextApiResponse } from 'next';
import { createWalletClient, http, createPublicClient, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import solc from 'solc';

interface DeployRequest {
  contractType: 'basic' | 'pro' | 'editions';
  name: string;
  symbol: string;
  maxSupply: number;
  mintPrice: string;
  baseTokenURI: string;
  // All tab configurations
  metadataConfig?: any;
  uploadConfig?: any;
  royaltyConfig?: any;
  deploymentConfig?: any;
  // Pro-specific
  royaltyRecipient?: string;
  royaltyPercentage?: number;
  onChainStorage?: boolean;
  // Editions-specific
  artworkName?: string;
  artworkDescription?: string;
  artworkImage?: string;
  artistName?: string;
  // Basic-specific
  nftItems?: any[];
}

// Generate a flattened contract without OpenZeppelin imports
function generateFlattenedContract(contractName: string, contractType: string, config: any): string {
  const { name, symbol, maxSupply, mintPrice, baseTokenURI, royaltyRecipient, royaltyPercentage, artworkName, artworkDescription, artworkImage, artistName, onChainStorage } = config;
  
  // Generate constructor based on contract type
  let constructorSignature = '';
  let constructorBody = '';
  
  switch (contractType) {
    case 'basic':
      constructorSignature = 'constructor(string memory name_, string memory symbol_, string memory baseTokenURI_)';
      constructorBody = `
        _name = name_;
        _symbol = symbol_;
        _baseTokenURI = baseTokenURI_;
        owner = msg.sender;`;
      break;
    case 'pro':
      constructorSignature = 'constructor(string memory name_, string memory symbol_, string memory baseTokenURI_, address royaltyRecipient_)';
      constructorBody = `
        _name = name_;
        _symbol = symbol_;
        _baseTokenURI = baseTokenURI_;
        owner = msg.sender;
        _royaltyRecipient = royaltyRecipient_;
        _royaltyFeeNumerator = ${royaltyPercentage ? Math.floor(royaltyPercentage * 100) : 250}; // ${royaltyPercentage || 2.5}% royalty`;
      break;
    case 'editions':
      constructorSignature = 'constructor(string memory name_, string memory symbol_, string memory baseTokenURI_, string memory artworkName_, string memory artworkDescription_, string memory artworkImage_, string memory artistName_)';
      constructorBody = `
        _name = name_;
        _symbol = symbol_;
        _baseTokenURI = baseTokenURI_;
        owner = msg.sender;
        _artworkName = artworkName_;
        _artworkDescription = artworkDescription_;
        _artworkImage = artworkImage_;
        _artistName = artistName_;`;
      break;
  }
  
  // Basic ERC721 implementation without OpenZeppelin dependencies
  const basicERC721 = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ${contractName} {
    string private _name;
    string private _symbol;
    string private _baseTokenURI;
    uint256 private _nextTokenId = 1;
    uint256 public constant MAX_SUPPLY = ${maxSupply};
    uint256 public MINT_PRICE = ${mintPrice};
    uint256 public constant MAX_PER_WALLET = 10;
    
    address public owner;
    bool public mintingActive = false;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(address => uint256) public mintedCount;
    
    // Pro-specific fields
    address private _royaltyRecipient;
    uint96 private _royaltyFeeNumerator = 250; // 2.5% default royalty (250/10000)
    bool public onChainStorageEnabled = ${onChainStorage || false};
    mapping(uint256 => string) private _onChainMetadata;
    
    // Editions-specific fields
    string private _artworkName;
    string private _artworkDescription;
    string private _artworkImage;
    string private _artistName;
    
    ${contractType === 'pro' || contractType === 'editions' ? `
    // Merkle whitelist support
    struct WhitelistGroup {
        bytes32 merkleRoot;
        bool isActive;
        uint256 startTime;
        uint256 endTime;
    }
    
    mapping(uint256 => WhitelistGroup) public whitelistGroups;
    uint256 public whitelistGroupCount;
    bool public whitelistEnabled = false;
    
    event WhitelistGroupCreated(uint256 indexed groupId, bytes32 merkleRoot);
    event WhitelistGroupUpdated(uint256 indexed groupId, bytes32 merkleRoot);
    event WhitelistToggled(bool enabled);
    ` : ''}
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    ${constructorSignature} {${constructorBody}
    }
    
    function name() public view returns (string memory) {
        return _name;
    }
    
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }
    
    function mint(uint256 quantity${contractType === 'pro' || contractType === 'editions' ? ', bytes32[] calldata merkleProof, uint256 groupId' : ''}) external payable {
        require(mintingActive, "Minting is not active");
        require(quantity > 0, "Quantity must be greater than 0");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Would exceed max supply");
        require(mintedCount[msg.sender] + quantity <= MAX_PER_WALLET, "Would exceed max per wallet");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        
        ${contractType === 'pro' || contractType === 'editions' ? `
        // Merkle whitelist verification
        if (whitelistEnabled) {
            WhitelistGroup memory group = whitelistGroups[groupId];
            require(group.isActive, "Whitelist group not active");
            
            // Check time window
            if (group.startTime > 0) {
                require(block.timestamp >= group.startTime, "Minting not started");
            }
            if (group.endTime > 0) {
                require(block.timestamp <= group.endTime, "Minting ended");
            }
            
            // Verify Merkle proof
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(_verifyMerkleProof(merkleProof, group.merkleRoot, leaf), "Invalid proof");
        }
        ` : ''}
        
        mintedCount[msg.sender] += quantity;
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            _owners[tokenId] = msg.sender;
            _balances[msg.sender]++;
            emit Transfer(address(0), msg.sender, tokenId);
        }
    }
    
    function setMintingActive(bool active) external onlyOwner {
        mintingActive = active;
    }
    
    function setMintPrice(uint256 newPrice) external onlyOwner {
        MINT_PRICE = newPrice;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner).transfer(balance);
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        ${contractType === 'pro' ? `
        // For Pro contracts, check if on-chain storage is enabled
        if (onChainStorageEnabled && bytes(_onChainMetadata[tokenId]).length > 0) {
            return _onChainMetadata[tokenId];
        }
        ` : ''}
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
    }
    
    function approve(address to, uint256 tokenId) public {
        address tokenOwner = _owners[tokenId];
        require(to != tokenOwner, "Approval to current owner");
        require(msg.sender == tokenOwner || _operatorApprovals[tokenOwner][msg.sender], "Not owner nor approved");
        
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner nor approved");
        _transfer(from, to, tokenId);
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner nor approved");
        _safeTransfer(from, to, tokenId, data);
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = _owners[tokenId];
        return (spender == tokenOwner || _tokenApprovals[tokenId] == spender || _operatorApprovals[tokenOwner][spender]);
    }
    
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(_owners[tokenId] == from, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to zero address");
        
        delete _tokenApprovals[tokenId];
        _owners[tokenId] = to;
        _balances[from]--;
        _balances[to]++;
        
        emit Transfer(from, to, tokenId);
    }
    
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "Transfer to non ERC721Receiver");
    }
    
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) internal returns (bool) {
        if (to.code.length == 0) return true;
        try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
            return retval == IERC721Receiver.onERC721Received.selector;
        } catch (bytes memory) {
            return false;
        }
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // EIP-2981 Royalty Support (Pro contracts only)
    ${contractType === 'pro' ? `
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        royaltyAmount = (salePrice * _royaltyFeeNumerator) / 10000;
        return (_royaltyRecipient, royaltyAmount);
    }
    
    function setRoyaltyRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient address");
        _royaltyRecipient = newRecipient;
    }
    
    function setRoyaltyFee(uint96 feeNumerator) external onlyOwner {
        require(feeNumerator <= 1000, "Royalty fee cannot exceed 10%");
        _royaltyFeeNumerator = feeNumerator;
    }
    
    function getRoyaltyRecipient() external view returns (address) {
        return _royaltyRecipient;
    }
    
    function getRoyaltyFee() external view returns (uint96) {
        return _royaltyFeeNumerator;
    }
    
    // On-chain Storage Support (Pro contracts only)
    function setTokenMetadata(uint256 tokenId, string memory metadata) external onlyOwner {
        require(_owners[tokenId] != address(0), "Token does not exist");
        _onChainMetadata[tokenId] = metadata;
    }
    
    function getTokenMetadata(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _onChainMetadata[tokenId];
    }
    
    function toggleOnChainStorage() external onlyOwner {
        onChainStorageEnabled = !onChainStorageEnabled;
    }
    ` : ''}
    
    ${contractType === 'pro' || contractType === 'editions' ? `
    // Merkle Proof Verification (inline implementation)
    function _verifyMerkleProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == root;
    }
    
    // Whitelist Group Management
    function createWhitelistGroup(
        bytes32 merkleRoot,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner {
        uint256 groupId = whitelistGroupCount;
        whitelistGroups[groupId] = WhitelistGroup({
            merkleRoot: merkleRoot,
            isActive: true,
            startTime: startTime,
            endTime: endTime
        });
        whitelistGroupCount++;
        emit WhitelistGroupCreated(groupId, merkleRoot);
    }
    
    function updateWhitelistGroup(uint256 groupId, bytes32 merkleRoot) external onlyOwner {
        require(groupId < whitelistGroupCount, "Group does not exist");
        whitelistGroups[groupId].merkleRoot = merkleRoot;
        emit WhitelistGroupUpdated(groupId, merkleRoot);
    }
    
    function toggleWhitelistGroup(uint256 groupId, bool isActive) external onlyOwner {
        require(groupId < whitelistGroupCount, "Group does not exist");
        whitelistGroups[groupId].isActive = isActive;
    }
    
    function toggleWhitelist(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
        emit WhitelistToggled(enabled);
    }
    
    function getWhitelistGroup(uint256 groupId) external view returns (
        bytes32 merkleRoot,
        bool isActive,
        uint256 startTime,
        uint256 endTime
    ) {
        require(groupId < whitelistGroupCount, "Group does not exist");
        WhitelistGroup memory group = whitelistGroups[groupId];
        return (group.merkleRoot, group.isActive, group.startTime, group.endTime);
    }
    ` : ''}
    
    // ERC-165 Support
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == 0x01ffc9a7 || // ERC-165
               interfaceId == 0x80ac58cd || // ERC-721
               interfaceId == 0x5b5e139f${contractType === 'pro' ? ' ||\n               interfaceId == 0x2a55205a' : ''};   // ERC-721Metadata${contractType === 'pro' ? ' + EIP-2981' : ''}
    }
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}`;

  return basicERC721;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!requireApiKey(req, res)) return

  try {
    const {
      contractType,
      name,
      symbol,
      maxSupply,
      mintPrice,
      baseTokenURI,
      metadataConfig,
      uploadConfig,
      royaltyConfig,
      deploymentConfig,
      royaltyRecipient,
      royaltyPercentage,
      onChainStorage,
      artworkName,
      artworkDescription,
      artworkImage,
      artistName,
      nftItems
    }: DeployRequest = req.body;

    if (!contractType || !name || !symbol || !maxSupply || !mintPrice || !baseTokenURI) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`🚀 Starting real deployment for contract type: ${contractType}`);
    console.log(`📝 Contract name: ${name}, symbol: ${symbol}`);

    // Generate a flattened contract without OpenZeppelin imports
    // Clean contract name to be valid Solidity identifier
    const contractName = name.replace(/[^a-zA-Z0-9]/g, '');
    console.log(`🧹 Cleaned contract name: "${name}" -> "${contractName}"`);
    
    const flattenedContract = generateFlattenedContract(contractName, contractType, {
      name,
      symbol,
      maxSupply,
      mintPrice,
      baseTokenURI,
      royaltyRecipient,
      royaltyPercentage,
      artworkName,
      artworkDescription,
      artworkImage,
      artistName
    });

    console.log('📄 Generated flattened contract');

    // Compile the contract
    const input = {
      language: 'Solidity',
      sources: {
        [`${contractName}.sol`]: {
          content: flattenedContract
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        }
      }
    };

    console.log('🔨 Compiling contract...');
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
      console.error('❌ Compilation errors:', output.errors);
      return res.status(500).json({ 
        error: 'Contract compilation failed',
        details: output.errors
      });
    }

    const contract = output.contracts[`${contractName}.sol`][contractName];
    const contractABI = contract.abi;
    const contractBytecode = contract.evm.bytecode.object;

    console.log('✅ Contract compiled successfully');

    // Return compiled contract data for client-side deployment
    console.log('📦 Returning compiled contract for client-side deployment');
    
    return res.status(200).json({
      success: true,
      contractType: contractType,
      contractName: contractName,
      contractABI: contractABI,
      contractBytecode: contractBytecode,
      constructorArgs: {
        basic: [name, symbol, baseTokenURI],
        pro: [name, symbol, baseTokenURI, royaltyRecipient || '0x0000000000000000000000000000000000000000'],
        editions: [name, symbol, baseTokenURI, artworkName || 'Untitled Artwork', artworkDescription || 'A unique digital artwork', artworkImage || '', artistName || 'Unknown Artist']
      },
      message: 'Contract compiled successfully - ready for client-side deployment'
    });

  } catch (error: any) {
    console.error('Deployment error:', error);
    res.status(500).json({
      error: 'Deployment failed',
      details: error.message
    });
  }
}