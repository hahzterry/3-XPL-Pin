// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title PlasmaNFTPro
 * @dev Pro NFT Collection Contract - Advanced features with up to 10,000 tokens
 * Features:
 * - Advanced contract features
 * - Up to 10,000 tokens
 * - On-chain storage option
 * - Custom mint page
 * - Priority verification
 * - Developer support
 */
contract PlasmaNFTPro is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard, Pausable, IERC2981 {
    uint256 private _nextTokenId;
    
    uint256 public MAX_SUPPLY = 10000; // Pro tier limit (can be reduced)
    uint256 public constant MAX_PER_WALLET = 10; // Higher limit for pro
    uint256 public mintPrice = 1 ether; // Price in XPL
    
    bool public mintingActive = false;
    string private _baseTokenURI;
    
    // Pro features
    bool public onChainStorageEnabled = false;
    mapping(uint256 => string) private _onChainMetadata; // tokenId => metadata JSON
    mapping(address => uint256) public mintedByAddress;
    mapping(address => bool) public whitelist; // Whitelist management
    bool public whitelistEnabled = false;
    
    // Royalty support (ERC-2981 compatible)
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
    event WhitelistUpdated(address indexed user, bool status);
    event WhitelistToggled(bool enabled);
    event EmergencyPauseToggled(bool paused);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address _royaltyRecipient
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        royaltyRecipient = _royaltyRecipient;
        _nextTokenId = 1; // Start from token ID 1
    }

    function mint(uint256 quantity) external payable nonReentrant whenNotPaused {
        require(mintingActive, "Minting is not active");
        require(quantity > 0 && quantity <= 5, "Invalid quantity (max 5 for pro)");
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        require(mintedByAddress[msg.sender] + quantity <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        
        // Whitelist check
        if (whitelistEnabled) {
            require(whitelist[msg.sender], "Address not whitelisted");
        }

        mintedByAddress[msg.sender] += quantity;

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

    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }

    // Pro feature: Set on-chain metadata for a token
    function setTokenMetadata(uint256 tokenId, string memory metadata) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _onChainMetadata[tokenId] = metadata;
        emit MetadataUpdated(tokenId, metadata);
    }

    // Pro feature: Get on-chain metadata
    function getTokenMetadata(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _onChainMetadata[tokenId];
    }

    // Pro feature: Toggle on-chain storage
    function toggleOnChainStorage() external onlyOwner {
        onChainStorageEnabled = !onChainStorageEnabled;
        emit OnChainStorageToggled(onChainStorageEnabled);
    }

    // Pro feature: Set royalty information
    function setRoyalty(address recipient, uint256 percentage) external onlyOwner {
        require(percentage <= 1000, "Royalty cannot exceed 10%"); // Max 10%
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

    function withdrawAmount(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    // Burn function - allows token holders to burn their own tokens
    function burn(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized to burn this token");
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        emit TokenBurned(tokenId, owner);
    }

    // Emergency pause functions
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPauseToggled(true);
    }

    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyPauseToggled(false);
    }

    // Supply management - reduce max supply (can only reduce, not increase)
    function reduceMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply < MAX_SUPPLY, "Can only reduce max supply");
        require(newMaxSupply >= _nextTokenId - 1, "New max supply must be >= current supply");
        MAX_SUPPLY = newMaxSupply;
        emit MaxSupplyReduced(newMaxSupply);
    }

    // Whitelist management
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

    // EIP-2981 Royalty Standard Implementation
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view override returns (address, uint256) {
        require(_exists(tokenId), "Token does not exist");
        uint256 royaltyAmount = (salePrice * royaltyPercentage) / 10000;
        return (royaltyRecipient, royaltyAmount);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    function totalSupply() public view override returns (uint256) {
        return _nextTokenId - 1; // Subtract 1 because we start from token ID 1
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // The following functions are overrides required by Solidity.
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
}
