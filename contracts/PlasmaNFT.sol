// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PlasmaNFT is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_PER_WALLET = 10;
    uint256 public mintPrice = 1 ether; // Price in XPL
    
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
        _nextTokenId = 1; // Start from token ID 1
    }

    function mint(uint256 quantity) external payable nonReentrant {
        require(mintingActive, "Minting is not active");
        require(quantity > 0 && quantity <= 5, "Invalid quantity");
        require(_nextTokenId + quantity - 1 <= MAX_SUPPLY, "Exceeds max supply");
        require(mintedByAddress[msg.sender] + quantity <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

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