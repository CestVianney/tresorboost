const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FarmManager", function () {
    async function deployFarmManagerFixture() {
        const [owner, account2] = await ethers.getSigners();
        const FarmManager = await ethers.getContractFactory("FarmManager");
        const farmManager = await FarmManager.deploy();
        await farmManager.waitForDeployment();
        const farmAddress = ethers.Wallet.createRandom().address;
        const depositTokenAddress = ethers.Wallet.createRandom().address;
        return { account2, farmManager, farmAddress, depositTokenAddress };
    }

    it("Should add a farm and retrieve values", async function () {
        const { farmManager, farmAddress, depositTokenAddress } = await loadFixture(deployFarmManagerFixture);

        await farmManager.addFarm(
            true,
            1000,
            2,
            farmAddress,
            depositTokenAddress,
            "deposit(uint256,address)",
            "withdraw(uint256,address)",
            "getMaxWithdraw(address)",
            false
        );

        const farmInfo = await farmManager.getFarmInfo(farmAddress);
        expect(farmInfo.isActive).to.equal(true);
        expect(farmInfo.rewardRate).to.equal(1000);
        expect(farmInfo.farmType).to.equal(2);
        expect(farmInfo.depositToken).to.equal(depositTokenAddress);
        expect(farmInfo.depositSelector).to.equal("0x6e553f65");
        expect(farmInfo.withdrawSelector).to.equal("0x00f714ce");
        expect(farmInfo.maxWithdrawSelector).to.equal("0x69723d1d");
        expect(farmInfo.isVault4626).to.equal(false);
    });

    it("Should update a farm", async function () {
        const { farmManager, farmAddress, depositTokenAddress } = await loadFixture(deployFarmManagerFixture);

        // Générer des adresses valides avec un checksum correct
        const otherDepositAddress = ethers.Wallet.createRandom().address;

        await farmManager.addFarm(
            true,
            1000,
            2,
            farmAddress,
            depositTokenAddress,
            "deposit(uint256,address)",
            "withdraw(uint256,address)",
            "getMaxWithdraw(address)",
            false);

        const farmInfoBefore = await farmManager.getFarmInfo(farmAddress);
        expect(farmInfoBefore.depositToken).to.equal(depositTokenAddress);

        await farmManager.addFarm(
            true,
            1000,
            2,
            farmAddress,
            otherDepositAddress,
            "deposit(uint256,address)",
            "withdraw(uint256,address)",
            "getMaxWithdraw(address)",
            false
        );

        const farmInfoAfter = await farmManager.getFarmInfo(farmAddress);
        expect(farmInfoAfter.depositToken).to.equal(otherDepositAddress);
    });

    it("Should revert if the sender is not the owner", async function () {
        const { account2, farmManager, farmAddress, depositTokenAddress } = await loadFixture(deployFarmManagerFixture);

        try {
            await farmManager.connect(account2).addFarm(
                true,
                1000,
                2,
                farmAddress,
                depositTokenAddress,
                "deposit(uint256,address)",
                "withdraw(uint256,address)",
                "getMaxWithdraw(address)",
                false);
        } catch (error) {
            expect(error.message).to.include("OwnableUnauthorizedAccount");
        }
    });
});