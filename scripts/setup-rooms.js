const hre = require("hardhat");
const fs = require("fs");

// Initial BSTM rooms
const INITIAL_ROOMS = [
  {
    name: "FlowLedger",
    description: "Goods tracking and inventory management system"
  },
  {
    name: "BSTM Marketplace",
    description: "Decentralized commerce platform"
  },
  {
    name: "Analytics Hub",
    description: "Business intelligence and data insights"
  },
  {
    name: "Service Platform",
    description: "Operations management and service delivery"
  },
  {
    name: "Community Portal",
    description: "Social engagement and community building"
  },
  {
    name: "Payment Gateway",
    description: "Transaction processing and settlements"
  },
  {
    name: "Reputation System",
    description: "Trust scoring and verification"
  },
  {
    name: "Document Vault",
    description: "Secure document storage and sharing"
  },
  {
    name: "Task Manager",
    description: "Project and task coordination"
  },
  {
    name: "Training Center",
    description: "Skills development and education platform"
  }
];

async function main() {
  console.log("🏗️  Setting up BSTM Rooms...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Account:", deployer.address);

  // Load deployment info
  const deploymentFiles = fs.readdirSync("./deployments")
    .filter(f => f.includes(hre.network.name))
    .sort()
    .reverse();

  if (deploymentFiles.length === 0) {
    console.error("❌ No deployment found!");
    return;
  }

  const deploymentInfo = JSON.parse(
    fs.readFileSync(`./deployments/${deploymentFiles[0]}`)
  );

  const registryAddress = deploymentInfo.contracts.BSTMRoomRegistry.address;
  console.log("BSTMRoomRegistry:", registryAddress, "\n");

  const registry = await hre.ethers.getContractAt("BSTMRoomRegistry", registryAddress);

  console.log("📝 Creating rooms...\n");

  const createdRooms = [];

  for (let i = 0; i < INITIAL_ROOMS.length; i++) {
    const room = INITIAL_ROOMS[i];
    
    try {
      console.log(`[${i + 1}/${INITIAL_ROOMS.length}] Creating: ${room.name}`);
      
      const tx = await registry.createRoom(
        room.name,
        room.description,
        deployer.address
      );
      
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "RoomCreated");
      const roomId = event?.args?.roomId;
      
      console.log(`    ✅ Room ID: ${roomId?.toString()}`);
      
      createdRooms.push({
        id: roomId?.toString(),
        name: room.name,
        description: room.description
      });
      
    } catch (error) {
      console.error(`    ❌ Failed: ${error.message}`);
    }
  }

  console.log("\n✨ Setup complete!");
  console.log(`Created ${createdRooms.length} rooms`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
