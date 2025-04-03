const { ethers } = require("hardhat");
const UniswapV2Router02 = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const IUniswapV2Factory = require("@uniswap/v2-core/build/IUniswapV2Factory.json");
const { ZeroAddress } = require("ethers");

const main = async () => {
    const [owner] = await ethers.getSigners();
    console.log(`Deploying with account: ${owner.address}`);

    console.log("------------------------------DEPLOY FARM MANAGER------------------------------");
    const farmManager = await deployFarmManager();
    console.log("------------------------------DEPLOY FAKE EURe------------------------------");
    const aEURe = await deployMintFakeEURe(owner.address);
    console.log("------------------------------DEPLOY TRESOR BOOST CORE-------------------------");
    const tresorBoostCore = await deployTresorBoostCore(await farmManager.getAddress(), await owner.getAddress(), aEURe);
    console.log("------------------------------DEPLOY FAKE USDT------------------------------");
    const aUSDT = await deployMintFakeUSDT(owner.address);
    console.log("------------------------------ADD LIQUIDITY EURe USDT------------------------------");
    await addLiquidityEUReUSDT(aEURe, aUSDT);
    console.log("------------------------------DEPLOY VAULT 9%-------------------------------");
    const vaultUSDT75 = await deployVault(aUSDT, 900);
    console.log("------------------------------DEPLOY CLAIMABLE VAULT 10%------------------------------");
    const vaultUSDT10 = await deployClaimableVault(aUSDT, 1000);
    console.log("------------------------------DEPLOY VAULT 15%------------------------------");
    const vaultUSDT15 = await deployVault(aUSDT, 1500);
    console.log("------------------------------CREATE FARMS------------------------------");
    await createFarms(farmManager, await aUSDT.getAddress(), await vaultUSDT75.getAddress(), await vaultUSDT10.getAddress(), await vaultUSDT15.getAddress());
    console.log("------------------------------END OF DEPLOYMENT------------------------------");
}

async function deployFarmManager() {
    const FarmManager = await ethers.getContractFactory("FarmManager");
    const farmManager = await FarmManager.deploy();
    await farmManager.waitForDeployment();
    console.log("✅ FarmManager deployed to:", await farmManager.getAddress());
    return farmManager;
}

async function deployTresorBoostCore(farmManagerAddress, ownerAddress, aEURe) {
    const routerAddress = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
    const TresorBoostCore = await ethers.getContractFactory("TresorBoostCore");
    const tresorBoostCore = await TresorBoostCore.deploy(farmManagerAddress, ownerAddress, await aEURe.getAddress(), routerAddress);
    await tresorBoostCore.waitForDeployment();
    console.log("✅ TresorBoostCore deployed to:", await tresorBoostCore.getAddress());
    await aEURe.mint(await tresorBoostCore.getAddress(), ethers.parseEther("1000000000"));
    return tresorBoostCore;
}

async function deployVault(token, apr) {
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(token, apr);
    await vault.waitForDeployment();
    console.log("✅ Vault deployed to:", await vault.getAddress());
    await token.mint(await vault.getAddress(), ethers.parseEther("1000000000"));
    return vault;
}

async function deployClaimableVault(token, apr) {
    const ClaimableVault = await ethers.getContractFactory("ClaimableVault");
    const claimableVault = await ClaimableVault.deploy(token, apr);
    await claimableVault.waitForDeployment();
    console.log("✅ ClaimableVault deployed to:", await claimableVault.getAddress());
    await token.mint(await claimableVault.getAddress(), ethers.parseEther("1000000000"));
    return claimableVault;
}

async function deployVault4626(token) {
    const Vault4626 = await ethers.getContractFactory("Vault4626");
    const yieldRate = 10**13; //0.001% par block, ~=5;6%/jour
    const vault4626 = await Vault4626.deploy(token, yieldRate);
    await vault4626.waitForDeployment();
    console.log("✅ Vault4626 deployed to:", await vault4626.getAddress());
    await token.mint(await vault4626.getAddress(), ethers.parseEther("1000000000"));
    return vault4626;
}

async function deployMintFakeEURe(ownerAddress) {
    const FakeEURe = await ethers.getContractFactory("ERC20Mock");
    const fakeEURe = await FakeEURe.deploy("Alyra EURO Monerium", "aEURe", 18);
    await fakeEURe.waitForDeployment();
    console.log("✅ aEURe deployed to:", await fakeEURe.getAddress());
    await fakeEURe.mint(ownerAddress, ethers.parseEther("1000000000"));
    return fakeEURe;
}

async function deployMintFakeUSDT(ownerAddress) {
    const FakeUSDT = await ethers.getContractFactory("ERC20Mock");
    const fakeUSDT = await FakeUSDT.deploy("Alyra Tether USD", "aUSDT", 6);
    await fakeUSDT.waitForDeployment();
    console.log("✅ aUSDT deployed to:", await fakeUSDT.getAddress());
    await fakeUSDT.mint(ownerAddress, ethers.parseEther("1000000000"));
    return fakeUSDT;
}

async function addLiquidityEUReUSDT(aEURe, aUSDT) {
    const uniswapFactory = await ethers.getContractAt(IUniswapV2Factory.abi, "0xF62c03E08ada871A0bEb309762E260a7a6a880E6");
    const uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3");
    const [owner] = await ethers.getSigners();
    const amountEURe = ethers.parseEther("999000000");
    const amountUSDT = ethers.parseEther("999000000");

    await aEURe.approve(uniswapRouter.getAddress(), amountEURe);
    await aUSDT.approve(uniswapRouter.getAddress(), amountUSDT);

    let pair = await uniswapFactory.getPair(await aEURe.getAddress(), await aUSDT.getAddress());
    if (pair === ethers.ZeroAddress) {
        console.log("Paire non trouvée, création de la paire...");
        const transaction = await uniswapFactory.createPair(
            await aEURe.getAddress(),
            await aUSDT.getAddress()
        );
        await transaction.wait();
        console.log("Paire créée avec succès, tx hash : ", await transaction.hash);
        pair = await uniswapFactory.getPair(await aEURe.getAddress(), await aUSDT.getAddress());
    }
    console.log("✅ Paire trouvée", pair);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const tx = await uniswapRouter.addLiquidity(
        await aEURe.getAddress(),
        await aUSDT.getAddress(),
        amountEURe,
        amountUSDT,
        0,
        0,
        owner.address,
        deadline
    );

    await tx.wait();
    console.log("✅ Liquidité ajoutée avec succès");
}

async function createFarms(farmManager, usdtAddress, vaultUSDT75, vaultUSDT10, vaultUSDT15) {
    const farms = [
        { vault: vaultUSDT75, farmType: 0, rate: 400 },
        { vault: vaultUSDT15, farmType: 2, rate: 800 },
    ];

    for (const farm of farms) {
        await farmManager.addFarm(
            true,
            farm.rate,
            farm.farmType,
            farm.vault,
            usdtAddress,
            ZeroAddress,
            "deposit(uint256,address)",
            "withdraw(uint256,address)",
            "0x00000000",
            "getMaxWithdraw(address)",
            false
        );
        console.log("✅ Farm ", farm.farmType, " added to:", await farmManager.getAddress());
    }

    await farmManager.addFarm(
        true,
        1000,
        1,
        vaultUSDT10,
        usdtAddress,
        ZeroAddress,
        "deposit(uint256,address,uint256)",
        "withdraw(uint256,address)",
        "claimRewards(address)",
        "getMaxWithdraw(address)",
        false
    )
    console.log("✅ Farm ", 1, " added to:", await farmManager.getAddress());
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
