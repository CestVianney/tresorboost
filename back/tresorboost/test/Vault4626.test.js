const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault4626", function () {
    async function deployVaultFixture() {
        const [owner, account2] = await ethers.getSigners();
        const AUSDT = await ethers.getContractFactory("ERC20Mock");
        const aUSDT = await AUSDT.deploy("Alyra USDT", "AUSDT", 18);
        await aUSDT.waitForDeployment();
        const Vault4626 = await ethers.getContractFactory("Vault4626");
        const vault4626 = await Vault4626.deploy(aUSDT.target, 10**13);
        await vault4626.waitForDeployment();
        await aUSDT.mint(vault4626.target, ethers.parseEther("1000"));
        return { owner, account2, vault4626, aUSDT };
    }

    describe("AccrueYield", function () {
        let owner, vault4626, aUSDT;
        beforeEach(async function () {
            const fixture = await loadFixture(deployVaultFixture);
            owner = fixture.owner;
            vault4626 = fixture.vault4626;
            aUSDT = fixture.aUSDT;
        });
        it("Should accrue yield if blocks passed", async function () {
            await aUSDT.mint(owner.address, ethers.parseEther("100"));
            await aUSDT.connect(owner).approve(vault4626.target, ethers.parseEther("100"));
            await vault4626.connect(owner).deposit(ethers.parseEther("100"), owner.address);
            const beforeLastUpdateBlock = await vault4626.lastUpdateBlock();
            await ethers.provider.send("hardhat_mine", ["0xA"]); 
            await vault4626.accrueYield();
            const afterLastUpdateBlock = await vault4626.lastUpdateBlock();
            expect(afterLastUpdateBlock).to.be.gt(beforeLastUpdateBlock);
        });
    });
});
