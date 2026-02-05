const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("THoBoCoin Ecosystem", function () {
  let thoboCoin, roomRegistry, governance;
  let owner, addr1, addr2;
  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000000");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const THoBoCoin = await ethers.getContractFactory("THoBoCoin");
    thoboCoin = await THoBoCoin.deploy();
    await thoboCoin.deployed();

    const BSTMRoomRegistry = await ethers.getContractFactory("BSTMRoomRegistry");
    roomRegistry = await BSTMRoomRegistry.deploy(thoboCoin.address);
    await roomRegistry.deployed();

    const THoBoGovernance = await ethers.getContractFactory("THoBoGovernance");
    governance = await THoBoGovernance.deploy(thoboCoin.address);
    await governance.deployed();
  });

  describe("THoBoCoin", function () {
    it("Should have correct initial supply", async function () {
      expect(await thoboCoin.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should assign total supply to owner", async function () {
      expect(await thoboCoin.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should have correct name and symbol", async function () {
      expect(await thoboCoin.name()).to.equal("THoBoCoin");
      expect(await thoboCoin.symbol()).to.equal("THB");
    });

    it("Should allow transfers", async function () {
      const amount = ethers.utils.parseEther("1000");
      await thoboCoin.transfer(addr1.address, amount);
      expect(await thoboCoin.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should allow burning tokens", async function () {
      const burnAmount = ethers.utils.parseEther("1000");
      await thoboCoin.burn(burnAmount);
      expect(await thoboCoin.totalSupply()).to.equal(INITIAL_SUPPLY.sub(burnAmount));
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      const amount = ethers.utils.parseEther("10000");
      await thoboCoin.transfer(addr1.address, amount);
    });

    it("Should allow staking tokens", async function () {
      const stakeAmount = ethers.utils.parseEther("1000");
      const lockPeriod = 86400;

      await thoboCoin.connect(addr1).stake(stakeAmount, lockPeriod);
      
      const stakeInfo = await thoboCoin.getStakeInfo(addr1.address);
      expect(stakeInfo.amount).to.equal(stakeAmount);
    });

    it("Should allow unstaking after lock period", async function () {
      const stakeAmount = ethers.utils.parseEther("1000");
      const lockPeriod = 0;

      await thoboCoin.connect(addr1).stake(stakeAmount, lockPeriod);
      await thoboCoin.connect(addr1).unstake();
      
      const stakeInfo = await thoboCoin.getStakeInfo(addr1.address);
      expect(stakeInfo.amount).to.equal(0);
    });
  });

  describe("BSTMRoomRegistry", function () {
    it("Should create a new room", async function () {
      await roomRegistry.createRoom("FlowLedger", "Tracking system", addr1.address);
      
      const room = await roomRegistry.getRoom(1);
      expect(room.name).to.equal("FlowLedger");
      expect(room.manager).to.equal(addr1.address);
    });

    it("Should not exceed max rooms", async function () {
      for (let i = 0; i < 63; i++) {
        await roomRegistry.createRoom(`Room ${i}`, "Description", addr1.address);
      }
      
      await expect(
        roomRegistry.createRoom("Extra Room", "Description", addr1.address)
      ).to.be.revertedWith("Maximum rooms reached");
    });
  });

  describe("THoBoGovernance", function () {
    beforeEach(async function () {
      const amount = ethers.utils.parseEther("20000");
      await thoboCoin.transfer(addr1.address, amount);
    });

    it("Should create a proposal", async function () {
      await governance.connect(addr1).createProposal(
        0,
        "Add New BSTM Room",
        "Proposal to add a new room"
      );
      
      const proposal = await governance.getProposal(1);
      expect(proposal.title).to.equal("Add New BSTM Room");
    });

    it("Should allow voting on proposal", async function () {
      await governance.connect(addr1).createProposal(
        0,
        "Add New BSTM Room",
        "Proposal"
      );
      
      const voteAmount = ethers.utils.parseEther("10000");
      await thoboCoin.transfer(addr2.address, voteAmount);
      
      await governance.connect(addr2).vote(1, true);
      
      const proposal = await governance.getProposal(1);
      expect(proposal.votesFor).to.equal(voteAmount);
    });
  });
});
