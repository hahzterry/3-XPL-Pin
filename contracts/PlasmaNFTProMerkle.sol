// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title PlasmaNFTProMerkle
 * @dev Pro NFT Collection Contract with Merkle Tree Whitelist Support
 * Features:
 * - Merkle tree based whitelist verification
 * - Multiple whitelist groups with different Merkle roots
 * - Time-based minting windows per group
 * - Gas-efficient whitelist verification
 * - All Pro features (royalties, on-chain storage, etc.)
 */
contract PlasmaNFTProMerkle is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard, Pausable, IERC2981 {
    uint256 private _nextTokenId;
    
    uint256 public MAX_SUPPLY = 10000;
    uint256 public constant MAX_PER_WALLET = 10;
    uint256 public mintPrice = 1 ether;
    
    bool public mintingActive = false;
    string private _baseTokenURI;
    
    // Pro features
    bool public onChainStorageEnabled = false;
    mapping(uint256 => string) private _onChainMetadata;
    mapping(address => uint256) public mintedByAddress;
    
    // Merkle whitelist groups
    struct WhitelistGroup {
        bytes32 merkleRoot;
        bool isActive;
        uint256 startTime;
        uint256 endTime;
        string groupName;
    }
    
    mapping(uint256 => WhitelistGroup) public whitelistGroups;
    uint256 public whitelistGroupCount;
    bool public whitelistEnabled = false;
    
    // Track mints per group per address
    mapping(uint256 => mapping(address => uint256)) public groupMintedByAddress;
    
    // Royalty support (ERC-2981)
    address public royaltyRecipient;
    uint256 public royaltyPercentage = 250; // 2.5% default
    
    event MintPriceUpdated(uint256 newPrice);
    event MintingToggled(bool active);
    event BaseURIUpdated(string newBaseURI);
    event OnChainStorageToggled(bool enabled);
    event MetadataUpdated(uint256 tokenId, string metadata);
    event RoyaltyUpdated(address recipient, uint256 percentage);
    event TokenBurned(uint256 tokenId, address owner);
    event MaxSupplyReduced(uint256 newMaxSupply);
    event WhitelistToggled(bool enabled);
    event WhitelistGroupCreated(uint256 indexed groupId, bytes32 merkleRoot, string groupName);
    event WhitelistGroupUpdated(uint256 indexed groupId, bytes32 merkleRoot);
    event EmergencyPauseToggled(bool paused);

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

    /**
     * @dev Mint with Merkle proof verification
     * @param quantity Number of tokens to mint
     * @param merkleProof Merkle proof for whitelist verification
     * @param groupId Whitelist group ID
     */
    function mint(
        uint256 quantity,
        bytes32[] calldata merkleProof,
        uint256 groupId
    ) external payable nonReentrant whenNotPaused {
        require(mintingActive, "Minting is not active");
        require(quantity > 0 && quantity <= 5, "Invalid quantity (max 5)");
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        require(mintedByAddress[msg.sender] + quantity <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        
        // Whitelist verification with Merkle proof
        if (whitelistEnabled) {
            WhitelistGroup memory group = whitelistGroups[groupId];
            require(group.isActive, "Whitelist group not active");
            
            // Check time window if set
            if (group.startTime > 0) {
                require(block.timestamp >= group.startTime, "Minting not started for this group");
            }
            if (group.endTime > 0) {
                require(block.timestamp <= group.endTime, "Minting ended for this group");
            }
            
            // Verify Merkle proof
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(
                MerkleProof.verify(merkleProof, group.merkleRoot, leaf),
                "Invalid Merkle proof - not whitelisted"
            );
        }

        mintedByAddress[msg.sender] += quantity;
        if (whitelistEnabled) {
            groupMintedByAddress[groupId][msg.sender] += quantity;
        }

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(msg.sender, tokenId);
        }

        // Refund excess payment
        if (msg.value > mintPrice * quantity) {
            payable(msg.sender).transfer(msg.value - (mintPrice * quantity));
        }
    }

    /**
     * @dev Create a new whitelist group with Merkle root
     */
    function createWhitelistGroup(
        bytes32 merkleRoot,
        uint256 startTime,
        uint256 endTime,
        string memory groupName
    ) external onlyOwner {
        uint256 groupId = whitelistGroupCount;
        whitelistGroups[groupId] = WhitelistGroup({
            merkleRoot: merkleRoot,
            isActive: true,
            startTime: startTime,
            endTime: endTime,
            groupName: groupName
        });
        whitelistGroupCount++;
        
        emit WhitelistGroupCreated(groupId, merkleRoot, groupName);
    }

    /**
     * @dev Update an existing whitelist group's Merkle root
     */
    function updateWhitelistGroup(
        uint256 groupId,
        bytes32 merkleRoot
    ) external onlyOwner {
        require(groupId < whitelistGroupCount, "Group does not exist");
        whitelistGroups[groupId].merkleRoot = merkleRoot;
        
        emit WhitelistGroupUpdated(groupId, merkleRoot);
    }

    /**
     * @dev Toggle whitelist group active status
     */
    function toggleWhitelistGroup(uint256 groupId, bool isActive) external onlyOwner {
        require(groupId < whitelistGroupCount, "Group does not exist");
        whitelistGroups[groupId].isActive = isActive;
    }

    /**
     * @dev Toggle whitelist requirement
     */
    function toggleWhitelist(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
        emit WhitelistToggled(enabled);
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

    function setMintingActive(bool active) external onlyOwner {
        mintingActive = active;
        emit MintingToggled(active);
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }

    function reduceMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply < MAX_SUPPLY, "Can only reduce max supply");
        require(newMaxSupply >= _nextTokenId - 1, "Cannot reduce below current supply");
        MAX_SUPPLY = newMaxSupply;
        emit MaxSupplyReduced(newMaxSupply);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    function toggleOnChainStorage(bool enabled) external onlyOwner {
        onChainStorageEnabled = enabled;
        emit OnChainStorageToggled(enabled);
    }

    function setTokenMetadata(uint256 tokenId, string memory metadata) external onlyOwner {
        require(onChainStorageEnabled, "On-chain storage not enabled");
        require(tokenId > 0 && tokenId < _nextTokenId, "Invalid token ID");
        _onChainMetadata[tokenId] = metadata;
        emit MetadataUpdated(tokenId, metadata);
    }

    function setRoyalty(address recipient, uint256 percentage) external onlyOwner {
        require(percentage <= 1000, "Royalty too high (max 10%)");
        royaltyRecipient = recipient;
        royaltyPercentage = percentage;
        emit RoyaltyUpdated(recipient, percentage);
    }

    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _burn(tokenId);
        emit TokenBurned(tokenId, msg.sender);
    }

    function toggleEmergencyPause() external onlyOwner {
        if (paused()) {
            _unpause();
        } else {
            _pause();
        }
        emit EmergencyPauseToggled(paused());
    }

    // View functions
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId < _nextTokenId, "Token does not exist");
        
        if (onChainStorageEnabled && bytes(_onChainMetadata[tokenId]).length > 0) {
            return _onChainMetadata[tokenId];
        }
        
        return super.tokenURI(tokenId);
    }

    function royaltyInfo(uint256, uint256 salePrice) external view override returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * royaltyPercentage) / 10000;
        return (royaltyRecipient, royaltyAmount);
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
        override(ERC721, ERC721Enumerable, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}

