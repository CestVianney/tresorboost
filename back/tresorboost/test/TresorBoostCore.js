const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("TresorBoostCore", function () {
    let owner, user, farmManager, swapManager, tresorBoostCore;
    async function deployContracts() {
        const [owner, user] = await ethers.getSigners();
        const farmManager = await ethers.deployContract("FarmManager");
        const swapManager = await ethers.deployContract("SwapManager");
        const tresorBoostCore = await ethers.deployContract("TresorBoostCore", [farmManager.address, swapManager.address, owner.address]);
        return { owner, user, farmManager, swapManager, tresorBoostCore };
    }

    async function setupUniswapAndLiquidity() {
        const [owner, user] = await ethers.getSigners();
        const uniswapV2Factory = await ethers.deployContract("../uniswap/contracts/UniswapV2Factory.sol");
        const uniswapV2Router = await ethers.deployContract("../uniswap/contracts/UniswapV2Router.sol", [uniswapV2Factory.address]);
        const uniswapV2Pair = await ethers.deployContract("../uniswap/contracts/UniswapV2Pair.sol", [uniswapV2Factory.address]);
        const uniswapV2Token = await ethers.deployContract("../uniswap/contracts/EURe.sol", [uniswapV2Factory.address]);
        return { uniswapV2Factory, uniswapV2Router, uniswapV2Pair };
    }

    describe("Deposit", function () {

        beforeEach(async function() {
            ({ owner, user, farmManager, swapManager, tresorBoostCore } = await loadFixture(deployContracts));

        });

        it("should deposit to the contract", async function () {
            const [owner, user] = await ethers.getSigners();
            const tresorBoostCore = await ethers.deployContract("TresorBoostCore");
        });
    });
}); 
