```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying THoBoCoin...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy THoBoCoin
  const THoBoCoin = await hre.ethers.getContractFactory("THoBoCoin");
  const thoboCoin = await THoBoCoin.deploy();
  await thoboCoin.deployed();

  console.log("✅ THoBoCoin deployed to:", thoboCoin.address);
  console.log("✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
