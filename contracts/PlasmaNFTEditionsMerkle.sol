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
 * @title PlasmaNFTEditionsMerkle
 * @dev Editions NFT Collection Contract with Merkle Tree Whitelist Support
 * Features:
 * - Merkle tree based whitelist verification
 * - Multiple whitelist groups
 * - Time-based minting windows per group
 * - Edition-based NFTs with predefined artwork
 */
contract PlasmaNFTEditionsMerkle is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard, Pausable, IERC2981 {
    uint256 private _nextTokenId;
    
    uint256 public MAX_SUPPLY = 10000;
    uint256 public constant MAX_PER_WALLET = 10;
    uint256 public mintPrice = 1 ether;
    
    bool public mintingActive = false;
    string private _baseTokenURI;
    
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
    
    mapping(uint256 => mapping(address => uint256)) public groupMintedByAddress;
    
    address public royaltyRecipient;
    uint256 public royaltyPercentage = 250;
    
    event MintPriceUpdated(uint256 newPrice);
    event MintingToggled(bool active);
    event BaseURIUpdated(string newBaseURI);
    event RoyaltyUpdated(address recipient, uint256 percentage);
    event TokenBurned(uint256 tokenId, address owner);
    event MaxSupplyReduced(uint256 newMaxSupply);
    event WhitelistToggled(bool enabled);
    event WhitelistGroupCreated(uint256 indexed groupId, bytes32 merkleRoot, string groupName);
    event WhitelistGroupUpdated(uint256 indexed groupId, bytes32 merkleRoot);

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

    function mint(
        uint256 quantity,
        bytes32[] calldata merkleProof,
        uint256 groupId
    ) external payable nonReentrant whenNotPaused {
        require(mintingActive, "Minting is not active");
        require(quantity > 0 && quantity <= 5, "Invalid quantity");
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        require(mintedByAddress[msg.sender] + quantity <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        
        if (whitelistEnabled) {
            WhitelistGroup memory group = whitelistGroups[groupId];
            require(group.isActive, "Whitelist group not active");
            
            if (group.startTime > 0) {
                require(block.timestamp >= group.startTime, "Minting not started");
            }
            if (group.endTime > 0) {
                require(block.timestamp <= group.endTime, "Minting ended");
            }
            
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(
                MerkleProof.verify(merkleProof, group.merkleRoot, leaf),
                "Invalid Merkle proof"
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

        if (msg.value > mintPrice * quantity) {
            payable(msg.sender).transfer(msg.value - (mintPrice * quantity));
        }
    }

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
        require(newMaxSupply < MAX_SUPPLY, "Can only reduce");
        require(newMaxSupply >= _nextTokenId - 1, "Below current supply");
        MAX_SUPPLY = newMaxSupply;
        emit MaxSupplyReduced(newMaxSupply);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        payable(owner()).transfer(balance);
    }

    function setRoyalty(address recipient, uint256 percentage) external onlyOwner {
        require(percentage <= 1000, "Too high");
        royaltyRecipient = recipient;
        royaltyPercentage = percentage;
        emit RoyaltyUpdated(recipient, percentage);
    }

    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        _burn(tokenId);
        emit TokenBurned(tokenId, msg.sender);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
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

