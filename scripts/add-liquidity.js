const hre = require("hardhat");
const fs = require("fs");

// PancakeSwap Router addresses
const PANCAKESWAP_ROUTER_MAINNET = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const PANCAKESWAP_ROUTER_TESTNET = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";

// Router ABI (minimal)
const ROUTER_ABI = [
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)"
];

async function main() {
  console.log("🥞 Adding liquidity to PancakeSwap...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "BNB\n");

  // Determine router address based on network
  const isMainnet = hre.network.name === "bscMainnet";
  const ROUTER_ADDRESS = isMainnet ? PANCAKESWAP_ROUTER_MAINNET : PANCAKESWAP_ROUTER_TESTNET;

  // Load deployment info
  const deploymentFiles = fs.readdirSync("./deployments")
    .filter(f => f.includes(hre.network.name))
    .sort()
    .reverse();

  if (deploymentFiles.length === 0) {
    console.error("❌ No deployment found for this network!");
    console.log("Run: npm run deploy:testnet (or deploy:mainnet)");
    return;
  }

  const deploymentInfo = JSON.parse(
    fs.readFileSync(`./deployments/${deploymentFiles[0]}`)
  );

  const thoboCoinAddress = deploymentInfo.contracts.THoBoCoin.address;
  console.log("THoBoCoin address:", thoboCoinAddress);

  // Get THoBoCoin contract
  const thoboCoin = await hre.ethers.getContractAt("THoBoCoin", thoboCoinAddress);

  // Configuration
  const THB_AMOUNT = ethers.utils.parseEther("10000"); // 10k THB
  const BNB_AMOUNT = ethers.utils.parseEther("1");      // 1 BNB

  console.log("\n📊 Liquidity Parameters:");
  console.log("THB Amount:", ethers.utils.formatEther(THB_AMOUNT));
  console.log("BNB Amount:", ethers.utils.formatEther(BNB_AMOUNT));
  console.log("Router:", ROUTER_ADDRESS);

  // Check balances
  const thbBalance = await thoboCoin.balanceOf(deployer.address);
  const bnbBalance = await deployer.getBalance();

  console.log("\n💰 Current Balances:");
  console.log("THB:", ethers.utils.formatEther(thbBalance));
  console.log("BNB:", ethers.utils.formatEther(bnbBalance));

  if (thbBalance.lt(THB_AMOUNT)) {
    console.error("\n❌ Insufficient THB balance!");
    return;
  }

  if (bnbBalance.lt(BNB_AMOUNT.add(ethers.utils.parseEther("0.01")))) {
    console.error("\n❌ Insufficient BNB balance!");
    return;
  }

  // Get router contract
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, deployer);

  // Approve router
  console.log("\n🔓 Approving PancakeSwap Router...");
  const approveTx = await thoboCoin.approve(ROUTER_ADDRESS, THB_AMOUNT);
  await approveTx.wait();
  console.log("✅ Approval confirmed");

  // Add liquidity
  console.log("\n💧 Adding liquidity...");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const addLiquidityTx = await router.addLiquidityETH(
    thoboCoinAddress,
    THB_AMOUNT,
    THB_AMOUNT.mul(95).div(100), // 5% slippage
    BNB_AMOUNT.mul(95).div(100),
    deployer.address,
    deadline,
    { value: BNB_AMOUNT }
  );

  console.log("Transaction hash:", addLiquidityTx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await addLiquidityTx.wait();
  console.log("✅ Liquidity added successfully!");
  
  console.log("\n🔗 Next steps:");
  console.log("1. Visit PancakeSwap: https://pancakeswap.finance/");
  console.log("2. Add THB token:", thoboCoinAddress);
  console.log("3. Start trading!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
