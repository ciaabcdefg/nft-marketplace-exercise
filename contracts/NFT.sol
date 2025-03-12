// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address public immutable contractAddress;
    mapping(address => bool) private _marketplaceApprovals;

    constructor(
        address marketplaceAddress
    ) ERC721("Metaverse Tokens", "METT") Ownable() {
        contractAddress = marketplaceAddress;
    }

    function createToken(string memory tokenURI) public returns (uint) {
        require(bytes(tokenURI).length > 0, "URI cannot be empty");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        _setMarketplaceApproval(msg.sender, true);
        return newItemId;
    }

    function _setMarketplaceApproval(address owner, bool approved) internal {
        _marketplaceApprovals[owner] = approved;
        emit ApprovalForAll(owner, contractAddress, approved);
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) public view override(ERC721, IERC721) returns (bool) {
        if (operator == contractAddress) {
            return _marketplaceApprovals[owner];
        }
        return super.isApprovedForAll(owner, operator);
    }

    function setApprovalForAll(
        address operator,
        bool approved
    ) public override(ERC721, IERC721) {
        if (operator == contractAddress) {
            _setMarketplaceApproval(msg.sender, approved);
        } else {
            super.setApprovalForAll(operator, approved);
        }
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override {
        super._afterTokenTransfer(from, to, firstTokenId, batchSize);

        // Ensure marketplace approval persists after transfer
        if (to != address(0)) {
            // Skip if it's a burn
            _setMarketplaceApproval(to, true);
        }
    }
}
