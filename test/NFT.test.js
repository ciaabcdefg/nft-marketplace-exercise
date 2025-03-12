const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT", function () {
  let nft;
  let owner;
  let addr1;
  let addr2;
  let marketplace;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a mock marketplace address first
    const NFTMarket = await ethers.getContractFactory("contracts/NFTMarketplace.sol:NFTMarket");
    marketplace = await NFTMarket.deploy();
    await marketplace.waitForDeployment();

    // Deploy NFT contract
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy(await marketplace.getAddress());
    await nft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await nft.name()).to.equal("Metaverse Tokens");
      expect(await nft.symbol()).to.equal("METT");
    });
  });

  describe("Minting", function () {
    it("Should create a new token", async function () {
      const tokenURI = "https://example.com/token/1";
      await nft.createToken(tokenURI);

      expect(await nft.ownerOf(1)).to.equal(owner.address);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
    });

    it("Should auto-approve marketplace for all tokens", async function () {
      const tokenURI = "https://example.com/token/1";
      await nft.createToken(tokenURI);

      expect(await nft.isApprovedForAll(owner.address, await marketplace.getAddress())).to.be.true;
    });

    it("Should increment token IDs correctly", async function () {
      await nft.createToken("https://example.com/token/1");
      await nft.createToken("https://example.com/token/2");

      expect(await nft.ownerOf(1)).to.equal(owner.address);
      expect(await nft.ownerOf(2)).to.equal(owner.address);
    });

    it("Should emit Transfer event on minting", async function () {
      const tokenURI = "https://example.com/token/1";
      await expect(nft.createToken(tokenURI))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, 1);
    });

    it("Should not allow minting with empty URI", async function () {
      await expect(nft.createToken("")).to.be.revertedWith("URI cannot be empty");
    });
  });

  describe("Token Transfers", function () {
    let tokenId;
    const tokenURI = "https://example.com/token/1";

    beforeEach(async function () {
      await nft.createToken(tokenURI);
      tokenId = 1;
    });

    it("Should allow owner to transfer tokens", async function () {
      await nft.transferFrom(owner.address, addr1.address, tokenId);
      expect(await nft.ownerOf(tokenId)).to.equal(addr1.address);
    });

    it("Should emit Transfer event on transfer", async function () {
      await expect(nft.transferFrom(owner.address, addr1.address, tokenId))
        .to.emit(nft, "Transfer")
        .withArgs(owner.address, addr1.address, tokenId);
    });

    it("Should not allow unauthorized transfers", async function () {
      await expect(
        nft.connect(addr1).transferFrom(owner.address, addr1.address, tokenId)
      ).to.be.reverted;
    });
  });

  describe("Token URI and Metadata", function () {
    it("Should revert when querying non-existent token", async function () {
      await expect(nft.tokenURI(999)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
    });

    it("Should maintain correct token URIs after transfers", async function () {
      const tokenURI = "https://example.com/token/1";
      await nft.createToken(tokenURI);
      await nft.transferFrom(owner.address, addr1.address, 1);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
    });
  });

  describe("Marketplace Integration", function () {
    it("Should maintain marketplace approval after token transfer", async function () {
      const tokenURI = "https://example.com/token/1";
      await nft.createToken(tokenURI);
      await nft.transferFrom(owner.address, addr1.address, 1);

      expect(await nft.isApprovedForAll(addr1.address, await marketplace.getAddress())).to.be.true;
    });

    it("Should allow marketplace to transfer tokens when approved", async function () {
      const tokenURI = "https://example.com/token/1";
      await nft.createToken(tokenURI);

      // Get marketplace address
      const marketplaceAddress = await marketplace.getAddress();

      // Verify marketplace is approved
      expect(await nft.isApprovedForAll(owner.address, marketplaceAddress)).to.be.true;

      // Create a new signer for the marketplace
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [marketplaceAddress],
      });

      const marketplaceSigner = await ethers.getSigner(marketplaceAddress);

      // Fund the marketplace address with some ETH for gas
      await owner.sendTransaction({
        to: marketplaceAddress,
        value: ethers.parseEther("1.0")
      });

      // Perform the transfer using the marketplace signer
      await nft.connect(marketplaceSigner).transferFrom(owner.address, addr1.address, 1);

      // Verify the transfer
      expect(await nft.ownerOf(1)).to.equal(addr1.address);

      // Stop impersonating
      await network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [marketplaceAddress],
      });
    });
  });
}); 