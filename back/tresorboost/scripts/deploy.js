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
    console.log("------------------------------DEPLOY FAKE EURe------------------------------");
    const aEURe = await deployMintFakeEURe(owner.address);
    console.log("------------------------------DEPLOY FAKE USDT------------------------------");
    const aUSDT = await deployMintFakeUSDT(owner.address);
    console.log("------------------------------ADD LIQUIDITY EURe USDT------------------------------");
    await addLiquidityEUReUSDT(aEURe, aUSDT);
    console.log("------------------------------DEPLOY VAULT 4%------------------------------");
    const vaultUSDC4 = await deployVault(aUSDT, 400);
    console.log("------------------------------DEPLOY VAULT 7.5%------------------------------");
    const vaultUSDT75 = await deployVault(aUSDT, 750);
    console.log("------------------------------DEPLOY VAULT 10%------------------------------");
    const vaultUSDC10 = await deployVault(aUSDT, 1000);
    console.log("------------------------------DEPLOY VAULT 15%------------------------------");
    const vaultUSDT15 = await deployVault(aUSDT, 1500);
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
    const EUReAddress = "0x67b34b93ac295c985e856E5B8A20D83026b580Eb";
    const routerAddress = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
    const TresorBoostCore = await ethers.getContractFactory("TresorBoostCore");
    const tresorBoostCore = await TresorBoostCore.deploy(farmManagerAddress, ownerAddress, EUReAddress, routerAddress);
    await tresorBoostCore.waitForDeployment();
    console.log("TresorBoostCore deployed to:", await tresorBoostCore.getAddress());
    return tresorBoostCore;
}

async function deployVault(token, apr) {
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(token, apr);
    await vault.waitForDeployment();
    console.log("Vault deployed to:", await vault.getAddress());
    await token.mint(await vault.getAddress(), ethers.parseEther("1000000000"));
    return vault;
}

async function deployMintFakeEURe(ownerAddress) {   
    const FakeEURe = await ethers.getContractFactory("ERC20Mock");
    const fakeEURe = await FakeEURe.deploy("Alyra EURO Monerium", "aEURe", 18);
    await fakeEURe.waitForDeployment();
    console.log("aEURe deployed to:", await fakeEURe.getAddress());
    await fakeEURe.mint(ownerAddress, ethers.parseEther("1000000000"));
    return fakeEURe;
}

async function deployMintFakeUSDT(ownerAddress) {
    const FakeUSDT = await ethers.getContractFactory("ERC20Mock");
    const fakeUSDT = await FakeUSDT.deploy("Alyra Tether USD", "aUSDT", 6);
    await fakeUSDT.waitForDeployment();
    console.log("aUSDT deployed to:", await fakeUSDT.getAddress());
    await fakeUSDT.mint(ownerAddress, ethers.parseEther("1000000000"));
    return fakeUSDT;
}

async function addLiquidityEUReUSDT(aEURe, aUSDT) {
    const uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3");
    const [owner] = await ethers.getSigners();
    const amountEURe = ethers.parseEther("990000000");
    const amountUSDT = ethers.parseEther("990000000");

    await aEURe.approve(uniswapRouter.getAddress(), amountEURe);
    await aUSDT.approve(uniswapRouter.getAddress(), amountUSDT);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    console.log("ON ARRIVE JUSQUE ICI")
    const tx = await uniswapRouter.addLiquidity(
        await aEURe.getAddress(),
        await aUSDT.getAddress(),
        amountEURe,
        amountUSDT,
        0, // amountEUReMin
        0, // amountUSDTMin
        owner.address,
        deadline
    );
    
    await tx.wait();
    console.log("Liquidité ajoutée avec succès");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
