const { ethers } = require("hardhat");
const UniswapV2Router02 = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

const main = async () => {
    const [owner] = await ethers.getSigners();
    console.log(`Deploying with account: ${owner.address}`);

    console.log("------------------------------DEPLOY FARM MANAGER------------------------------");
    const farmManager = await deployFarmManager();
    // console.log("------------------------------DEPLOY SWAP MANAGER------------------------------");
    // const swapManager = await deploySwapManager();
    console.log("------------------------------DEPLOY TRESOR BOOST CORE-------------------------");
    const tresorBoostCore = await deployTresorBoostCore(await farmManager.getAddress(), await owner.getAddress());
    
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    console.log("------------------------------DEPLOY VAULT 4%------------------------------");
    const vaultUSDC4 = await deployVault(USDCAddress, 400);
    console.log("------------------------------DEPLOY VAULT 7.5%------------------------------");
    const vaultUSDT75 = await deployVault(USDTAddress, 750);
    console.log("------------------------------DEPLOY VAULT 10%------------------------------");
    const vaultUSDC10 = await deployVault(USDCAddress, 1000);
    console.log("------------------------------DEPLOY VAULT 15%------------------------------");
    const vaultUSDT15 = await deployVault(USDTAddress, 1500);
}

async function deployFarmManager() {
    const FarmManager = await ethers.getContractFactory("FarmManager");
    const farmManager = await FarmManager.deploy();
    await farmManager.waitForDeployment();
    console.log("FarmManager deployed to:", await farmManager.getAddress());
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

async function deployVault(tokenAddress, apr) {
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(tokenAddress, apr);
    await vault.waitForDeployment();
    console.log("Vault deployed to:", await vault.getAddress());
    return vault;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
