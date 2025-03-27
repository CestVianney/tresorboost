const { ethers } = require("hardhat");
const UniswapV2Router02 = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

const main = async () => {
    const [owner] = await ethers.getSigners();
    console.log(`Deploying with account: ${owner.address}`);

    console.log("------------------------------DEPLOY FARM MANAGER------------------------------");
    const farmManager = await deployFarmManager();
    // console.log("------------------------------DEPLOY SWAP MANAGER------------------------------");
    // const swapManager = await deploySwapManager();
    console.log("------------------------------DEPLOY TRESOR BOOST CORE------------------------------");
    const tresorBoostCore = await deployTresorBoostCore(await farmManager.getAddress(), await owner.getAddress());
}

async function deployFarmManager() {
    const FarmManager = await ethers.getContractFactory("FarmManager");
    const farmManager = await FarmManager.deploy();
    await farmManager.waitForDeployment();
    console.log("FarmManager deployed to:", await farmManager.getAddress());
    console.log(await ethers.provider.getCode(await farmManager.getAddress()));
    return farmManager;
}

async function deploySwapManager() {
    const SwapManager = await ethers.getContractFactory("SwapManager");
    const swapManager = await SwapManager.deploy();
    await swapManager.waitForDeployment();
    console.log("SwapManager deployed to:", await swapManager.getAddress());
    return swapManager;
}

async function deployTresorBoostCore(farmManagerAddress, ownerAddress) {
    const EUReAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const routerAddress = "0x3231Cb76718CDeF2155FC47b5286d82e6eDA273f";
    const TresorBoostCore = await ethers.getContractFactory("TresorBoostCore");
    const tresorBoostCore = await TresorBoostCore.deploy(farmManagerAddress, ownerAddress, EUReAddress, routerAddress);
    await tresorBoostCore.waitForDeployment();
    console.log("TresorBoostCore deployed to:", await tresorBoostCore.getAddress());
    return tresorBoostCore;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
