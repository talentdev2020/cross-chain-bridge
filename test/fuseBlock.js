const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

describe("FuseBlock", function () {
  let FuseBlock;
  let MockAura;
  let fuseBlock;
  let mockAura;
  let admin, user;

  before(async function() {
    [admin, user] = await ethers.getSigners();
    MockAura = await ethers.getContractFactory("MockERC20");
    FuseBlock = await ethers.getContractFactory("FuseBlock");
  })
  beforeEach(async function() {
    mockAura = await MockAura.deploy();
    await mockAura.deployed();

    fuseBlock = await FuseBlock.deploy(mockAura.address);
    await fuseBlock.deployed();

    await mockAura.approve(fuseBlock.address, parseEther("1000"));
  })

  it("Should Mint NFT", async function () {
   await expect(() => fuseBlock.mint(parseEther("100"))).to.changeTokenBalance(mockAura, fuseBlock, parseEther("100"));

  expect(await fuseBlock.ownerOf(1)).to.be.equal(admin.address);
   const amount = await fuseBlock.getAuraAmount(1);
   expect(amount).to.be.equal(parseEther("100"));
  });

  it("Should Burn NFT", async function () {
    await fuseBlock.mint(parseEther("100"));
    await expect(fuseBlock.connect(user).burn(1)).to.be.revertedWith("not owner of the token");
    await expect(() => fuseBlock.burn(1)).to.changeTokenBalance(mockAura, admin, parseEther("100"));
    await expect(fuseBlock.ownerOf(1)).to.be.reverted;
  });

  it("Should user gets the aura token after NFT ownership is changed from admin to user", async function () {
    await fuseBlock.mint(parseEther("100"));
    
    // transfer NFT from admin to user;
    await fuseBlock.approve(user.address, 1);
    await fuseBlock.transferFrom(admin.address, user.address, 1);

    // check if user gets the aura from the NFT when it is burned
    await expect(fuseBlock.burn(1)).to.be.revertedWith("not owner of the token");
    await expect(() => fuseBlock.connect(user).burn(1)).to.changeTokenBalance(mockAura, user, parseEther("100"));
  });

  it(`Should return tokenURI`, async function () {
    await fuseBlock.mint(parseEther("100"));
    
    const tokenURI = await fuseBlock.tokenURI(1);
    expect(tokenURI).to.be.equal(`ipfs://test/1.json`);
  });
  
  it("Should modify the baseURI", async function () {
    await fuseBlock.mint(parseEther("100"));
    await fuseBlock.setBaseURI("ipfs://testURI");

    const tokenURI = await fuseBlock.tokenURI(1);
    expect(tokenURI).to.be.equal(`ipfs://testURI/1.json`);
  });
});
