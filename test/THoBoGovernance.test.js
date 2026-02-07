const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("THoBoGovernance", function () {
  let governance, thoboCoin, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const THoBoCoin = await ethers.getContractFactory("THoBoCoin");
    thoboCoin = await THoBoCoin.deploy();
    await thoboCoin.deployed();

    const THoBoGovernance = await ethers.getContractFactory("THoBoGovernance");
    governance = await THoBoGovernance.deploy(thoboCoin.address);
    await governance.deployed();

    await thoboCoin.transfer(addr1.address, ethers.utils.parseEther("10000"));
  });

  it("Should create and vote on a proposal", async function () {
    await governance.connect(addr1).createProposal(0, "Test Proposal", "Description");
    await governance.connect(addr1).vote(1, true);

    const proposal = await governance.getProposal(1);
    expect(proposal.votesFor).to.be.above(0);
  });
});
