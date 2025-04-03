const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
    async function deployVaultFixture() {
        const [owner, account2] = await ethers.getSigners();
        const AUSDT = await ethers.getContractFactory("AUSDT");
        const aUSDT = await AUSDT.deploy();
        await aUSDT.waitForDeployment();
        const Vault = await ethers.getContractFactory("Vault");
        const vault = await Vault.deploy(aUSDT.target, 1000);
        await vault.waitForDeployment();
        return { owner, account2, vault, aUSDT };
    }

    it("Should deploy the contract", async function () {
        const { vault } = await loadFixture(deployVaultFixture);
        expect(await vault.owner()).to.equal(owner.address);
    });


    
    
})