const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
    async function deployVaultFixture() {
        const [owner, account2] = await ethers.getSigners();
        const AUSDT = await ethers.getContractFactory("ERC20Mock");
        const aUSDT = await AUSDT.deploy("Alyra USDT", "AUSDT", 18);
        await aUSDT.waitForDeployment();
        const Vault = await ethers.getContractFactory("Vault");
        const vault = await Vault.deploy(aUSDT.target, 1000);
        await vault.waitForDeployment();
        return { owner, account2, vault, aUSDT };
    }
    describe("Deposit", function () {
        let owner, vault, aUSDT;
        beforeEach(async function () {
            const fixture = await loadFixture(deployVaultFixture);
            owner = fixture.owner;
            vault = fixture.vault;
            aUSDT = fixture.aUSDT;
        });
        it("Should revert if amount is 0", async function () {
            await aUSDT.mint(owner.address, ethers.parseEther("1000"));
            await aUSDT.connect(owner).approve(vault.target, ethers.parseEther("1000"));
            await expect(vault.connect(owner).deposit(ethers.parseEther("0"), owner.address)).to.be.revertedWith("Amount must be greater than 0");
        });
    });
    describe("Withdraw", function () {
        let owner, vault, aUSDT;
        beforeEach(async function () {
            const fixture = await loadFixture(deployVaultFixture);
            owner = fixture.owner;
            vault = fixture.vault;
            aUSDT = fixture.aUSDT;
        });
        it("Should revert if amount is 0", async function () {
            await aUSDT.mint(owner.address, ethers.parseEther("1000"));
            await aUSDT.connect(owner).approve(vault.target, ethers.parseEther("1000"));
            await expect(vault.connect(owner).withdraw(ethers.parseEther("0"), owner.address)).to.be.revertedWith("Amount must be greater than 0");
        });
        it("Should revert if amount is greater than balance", async function () {
            await aUSDT.mint(owner.address, ethers.parseEther("1000"));
            await aUSDT.connect(owner).approve(vault.target, ethers.parseEther("1000"));
            await vault.connect(owner).deposit(ethers.parseEther("1000"), owner.address);
            await expect(vault.connect(owner).withdraw(ethers.parseEther("1001"), owner.address)).to.be.revertedWith("Insufficient balance");
        });
    });

    describe("GetRewards", function () {
        let owner, vault, aUSDT, account2;
        beforeEach(async function () {
            const fixture = await loadFixture(deployVaultFixture);
            owner = fixture.owner;
            vault = fixture.vault;
            aUSDT = fixture.aUSDT;
            account2 = fixture.account2;
        });
        it("Should return a value if deposited", async function () {
            await aUSDT.mint(owner.address, ethers.parseEther("1000"));
            await aUSDT.connect(owner).approve(vault.target, ethers.parseEther("1000"));
            await vault.connect(owner).deposit(ethers.parseEther("1000"), owner.address);
            //pass time
            await ethers.provider.send("evm_increaseTime", [60]);
            await ethers.provider.send("evm_mine");
            expect(await vault.connect(owner).getRewards(owner.address)).to.be.gt(1000);
        });
        it("Should return 0 if no deposit", async function () {
            expect(await vault.connect(account2).getRewards(owner.address)).to.equal(0);
        });
    });
})