import { NextApiRequest, NextApiResponse } from 'next';
import solc from 'solc';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractType, name, symbol, maxSupply, mintPrice } = req.body;

    console.log(`🔍 Testing ${contractType} contract compilation...`);

    // Use embedded contract sources for testing (avoids file system and import issues)
    let contractSource = '';
    let contractName = '';

    if (contractType === 'basic') {
      contractName = 'PlasmaNFTBasic';
      contractSource = getEmbeddedContractSource(contractType);
    } else if (contractType === 'pro') {
      contractName = 'PlasmaNFTPro';
      contractSource = getEmbeddedContractSource(contractType);
    } else if (contractType === 'editions') {
      contractName = 'PlasmaNFTEditions';
      contractSource = getEmbeddedContractSource(contractType);
    } else {
      return res.status(400).json({ error: 'Invalid contract type' });
    }

    // Prepare the Solidity compiler input
    const input = {
      language: 'Solidity',
      sources: {
        [`${contractName}.sol`]: {
          content: contractSource
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

    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for compilation errors
    if (output.errors) {
      const errors = output.errors.filter((error: any) => error.severity === 'error');
      if (errors.length > 0) {
        console.error('Compilation errors:', errors);
        return res.status(400).json({
          error: 'Compilation failed',
          details: errors.map((error: any) => error.formattedMessage).join('\n'),
          errors: errors
        });
      }
    }

    // Get the compiled contract
    const contract = output.contracts[`${contractName}.sol`][contractName];
    
    if (!contract) {
      return res.status(400).json({ error: 'Contract not found in compilation output' });
    }

    const bytecode = contract.evm.bytecode.object;
    const abi = contract.abi;

    console.log(`✅ ${contractType} contract compiled successfully`);

    res.status(200).json({
      success: true,
      contractType,
      contractName,
      bytecode,
      abi,
      bytecodeLength: bytecode.length,
      abiLength: abi.length,
      message: `${contractType} contract compiled successfully`
    });

  } catch (error: any) {
    console.error('❌ Contract compilation error:', error);
    res.status(500).json({
      error: 'Contract compilation failed',
      details: error.message
    });
  }
}

function getEmbeddedContractSource(contractType: string): string {
  // Simple test contracts without external dependencies
  if (contractType === 'basic') {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PlasmaNFTBasic {
    string public name;
    string public symbol;
    uint256 public MAX_SUPPLY;
    uint256 public constant MINT_PRICE = 0.01 ether;
    uint256 public constant MAX_PER_WALLET = 5;
    
    string private baseTokenURI;
    bool public mintingActive = false;
    mapping(address => uint256) public mintedCount;
    mapping(address => bool) public whitelist;
    bool public whitelistEnabled = false;
    
    address public owner;
    uint256 public totalSupply;
    
    event TokenBurned(uint256 indexed tokenId);
    event MaxSupplyReduced(uint256 indexed newMaxSupply);
    event WhitelistUpdated(address indexed user, bool indexed status);
    event WhitelistToggled(bool indexed enabled);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory collectionName,
        uint256 maxSupply,
        uint256 mintPrice,
        uint256 maxPerWallet
    ) {
        name = _name;
        symbol = _symbol;
        MAX_SUPPLY = maxSupply;
        owner = msg.sender;
        baseTokenURI = "https://gen-plasma.com/api/metadata/basic/";
    }
    
    function mint(uint256 quantity) external payable {
        require(mintingActive, "Minting is not active");
        require(quantity > 0, "Quantity must be greater than 0");
        require(totalSupply + quantity <= MAX_SUPPLY, "Would exceed max supply");
        require(mintedCount[msg.sender] + quantity <= MAX_PER_WALLET, "Would exceed max per wallet");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        
        if (whitelistEnabled) {
            require(whitelist[msg.sender], "Address not whitelisted");
        }
        
        mintedCount[msg.sender] += quantity;
        totalSupply += quantity;
    }
    
    function setMintingActive(bool active) external onlyOwner {
        mintingActive = active;
    }
    
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function withdrawAmount(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    function reduceMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply < MAX_SUPPLY, "New supply must be less than current");
        require(newMaxSupply >= totalSupply, "New supply must be at least current supply");
        MAX_SUPPLY = newMaxSupply;
        emit MaxSupplyReduced(newMaxSupply);
    }
    
    function addToWhitelist(address user) external onlyOwner {
        whitelist[user] = true;
        emit WhitelistUpdated(user, true);
    }
    
    function removeFromWhitelist(address user) external onlyOwner {
        whitelist[user] = false;
        emit WhitelistUpdated(user, false);
    }
    
    function toggleWhitelist() external onlyOwner {
        whitelistEnabled = !whitelistEnabled;
        emit WhitelistToggled(whitelistEnabled);
    }
    
    function isWhitelisted(address user) external view returns (bool) {
        return whitelist[user];
    }
}`;
  }
  
  if (contractType === 'pro') {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PlasmaNFTPro {
    string public name;
    string public symbol;
    uint256 public MAX_SUPPLY;
    uint256 public constant MINT_PRICE = 0.05 ether;
    uint256 public constant MAX_PER_WALLET = 5;
    
    string private baseTokenURI;
    bool public mintingActive = false;
    mapping(address => uint256) public mintedCount;
    mapping(address => bool) public whitelist;
    bool public whitelistEnabled = false;
    bool public paused = false;
    
    address public owner;
    uint256 public totalSupply;
    
    // Royalty info
    address public royaltyRecipient;
    uint256 public royaltyPercentage;
    
    event TokenBurned(uint256 indexed tokenId);
    event MaxSupplyReduced(uint256 indexed newMaxSupply);
    event WhitelistUpdated(address indexed user, bool indexed status);
    event WhitelistToggled(bool indexed enabled);
    event EmergencyPauseToggled(bool indexed paused);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory collectionName,
        uint256 maxSupply,
        uint256 mintPrice,
        uint256 maxPerWallet
    ) {
        name = _name;
        symbol = _symbol;
        MAX_SUPPLY = maxSupply;
        owner = msg.sender;
        baseTokenURI = "https://gen-plasma.com/api/metadata/pro/";
    }
    
    function mint(uint256 quantity) external payable whenNotPaused {
        require(mintingActive, "Minting is not active");
        require(quantity > 0, "Quantity must be greater than 0");
        require(totalSupply + quantity <= MAX_SUPPLY, "Would exceed max supply");
        require(mintedCount[msg.sender] + quantity <= MAX_PER_WALLET, "Would exceed max per wallet");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        
        if (whitelistEnabled) {
            require(whitelist[msg.sender], "Address not whitelisted");
        }
        
        mintedCount[msg.sender] += quantity;
        totalSupply += quantity;
    }
    
    function setMintingActive(bool active) external onlyOwner {
        mintingActive = active;
    }
    
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }
    
    function pause() external onlyOwner {
        paused = true;
        emit EmergencyPauseToggled(true);
    }
    
    function unpause() external onlyOwner {
        paused = false;
        emit EmergencyPauseToggled(false);
    }
    
    function setRoyalty(address recipient, uint256 percentage) external onlyOwner {
        royaltyRecipient = recipient;
        royaltyPercentage = percentage;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function withdrawAmount(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    function reduceMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply < MAX_SUPPLY, "New supply must be less than current");
        require(newMaxSupply >= totalSupply, "New supply must be at least current supply");
        MAX_SUPPLY = newMaxSupply;
        emit MaxSupplyReduced(newMaxSupply);
    }
    
    function addToWhitelist(address user) external onlyOwner {
        whitelist[user] = true;
        emit WhitelistUpdated(user, true);
    }
    
    function removeFromWhitelist(address user) external onlyOwner {
        whitelist[user] = false;
        emit WhitelistUpdated(user, false);
    }
    
    function toggleWhitelist() external onlyOwner {
        whitelistEnabled = !whitelistEnabled;
        emit WhitelistToggled(whitelistEnabled);
    }
    
    function isWhitelisted(address user) external view returns (bool) {
        return whitelist[user];
    }
}`;
  }
  
  if (contractType === 'editions') {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PlasmaNFTEditions {
    string public name;
    string public symbol;
    uint256 public MAX_SUPPLY;
    uint256 public constant MINT_PRICE = 0.1 ether;
    uint256 public constant MAX_PER_WALLET = 5;
    
    string private baseTokenURI;
    string private editionMetadataURI;
    bool public mintingActive = false;
    mapping(address => uint256) public mintedCount;
    mapping(address => bool) public whitelist;
    bool public whitelistEnabled = false;
    bool public paused = false;
    
    address public owner;
    uint256 public totalSupply;
    
    // Artwork metadata
    string public artworkName;
    string public artworkDescription;
    string public artworkImage;
    string public artistName;
    
    event TokenBurned(uint256 indexed tokenId);
    event MaxSupplyReduced(uint256 indexed newMaxSupply);
    event WhitelistUpdated(address indexed user, bool indexed status);
    event WhitelistToggled(bool indexed enabled);
    event EmergencyPauseToggled(bool indexed paused);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory collectionName,
        uint256 maxSupply,
        uint256 mintPrice,
        uint256 maxPerWallet
    ) {
        name = _name;
        symbol = _symbol;
        MAX_SUPPLY = maxSupply;
        owner = msg.sender;
        baseTokenURI = "https://gen-plasma.com/api/metadata/editions/";
    }
    
    function mint(uint256 quantity) external payable whenNotPaused {
        require(mintingActive, "Minting is not active");
        require(quantity > 0, "Quantity must be greater than 0");
        require(totalSupply + quantity <= MAX_SUPPLY, "Would exceed max supply");
        require(mintedCount[msg.sender] + quantity <= MAX_PER_WALLET, "Would exceed max per wallet");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        
        if (whitelistEnabled) {
            require(whitelist[msg.sender], "Address not whitelisted");
        }
        
        mintedCount[msg.sender] += quantity;
        totalSupply += quantity;
    }
    
    function setMintingActive(bool active) external onlyOwner {
        mintingActive = active;
    }
    
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }
    
    function setEditionMetadata(string memory newMetadataURI) external onlyOwner {
        editionMetadataURI = newMetadataURI;
    }
    
    function setArtworkMetadata(
        string memory _artworkName,
        string memory _artworkDescription,
        string memory _artworkImage,
        string memory _artistName
    ) external onlyOwner {
        artworkName = _artworkName;
        artworkDescription = _artworkDescription;
        artworkImage = _artworkImage;
        artistName = _artistName;
    }
    
    function pause() external onlyOwner {
        paused = true;
        emit EmergencyPauseToggled(true);
    }
    
    function unpause() external onlyOwner {
        paused = false;
        emit EmergencyPauseToggled(false);
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function withdrawAmount(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    function reduceMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply < MAX_SUPPLY, "New supply must be less than current");
        require(newMaxSupply >= totalSupply, "New supply must be at least current supply");
        MAX_SUPPLY = newMaxSupply;
        emit MaxSupplyReduced(newMaxSupply);
    }
    
    function addToWhitelist(address user) external onlyOwner {
        whitelist[user] = true;
        emit WhitelistUpdated(user, true);
    }
    
    function removeFromWhitelist(address user) external onlyOwner {
        whitelist[user] = false;
        emit WhitelistUpdated(user, false);
    }
    
    function toggleWhitelist() external onlyOwner {
        whitelistEnabled = !whitelistEnabled;
        emit WhitelistToggled(whitelistEnabled);
    }
    
    function isWhitelisted(address user) external view returns (bool) {
        return whitelist[user];
    }
}`;
  }
  
  // Fallback
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PlaceholderContract {
    string public name;
    string public symbol;
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
}`;
}
