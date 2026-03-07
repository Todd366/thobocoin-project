const hre = require("hardhat");

async function main() {
  const THoBoCoin = await hre.ethers.getContractFactory("THoBoCoin");
  const thoboCoin = await THoBoCoin.deploy();
  await thoboCoin.waitForDeployment();
  console.log("THoBoCoin deployed to:", await thoboCoin.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
