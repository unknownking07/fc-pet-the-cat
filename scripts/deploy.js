const { ethers } = require("hardhat");

async function main() {
  const CatScoreBoard = await ethers.getContractFactory("CatScoreBoard");
  const contract = await CatScoreBoard.deploy();
  await contract.deployed();

  console.log("✅ CatScoreBoard deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
