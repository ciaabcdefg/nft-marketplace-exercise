const hre = require("hardhat");

async function main() {
  const NFTMarket = await hre.ethers.getContractFactory("NFTMarket");
  const nftMarket = await NFTMarket.deploy();
  await nftMarket.waitForDeployment();
  console.log("NFTMarket deployed to:", await nftMarket.getAddress());

  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy(await nftMarket.getAddress());
  await nft.waitForDeployment();
  console.log("NFT deployed to:", await nft.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 