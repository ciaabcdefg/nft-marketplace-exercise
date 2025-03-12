const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT", function () {
  let nft;
  let owner;
  let addr1;
  let marketplace;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

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
  });
}); 