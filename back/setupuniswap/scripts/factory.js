const { ethers } = require("hardhat");

const main = async () => {

    console.log("------------------------------DEPLOY UNISWAP FACTORY---------------------");
    const factoryInstance = await deployFactory();
    console.log("------------------------------DEPLOY WETH--------------------------------");
    const wethInstance = await deployWETH();
    console.log("------------------------------DEPLOY UNISWAP ROUTER----------------------");
    const factoryAddress = await factoryInstance.getAddress();
    const wethAddress = await wethInstance.getAddress();
    const routerInstance = await deployRouter(factoryAddress, wethAddress);
    console.log("------------------------------DEPLOY aUSDT-------------------------------");
    const aUSDTInstance = await deployaUSDT();
    console.log("------------------------------DEPLOY aUSDC-------------------------------");
    const aUSDCInstance = await deployaUSDC();
    console.log("------------------------------DEPLOY EURe--------------------------------");
    const EUReInstance = await deployEURe();
    console.log("------------------------------ADD LIQUIDITY------------------------------");
    await addLiquidity(factoryInstance, routerInstance, aUSDTInstance, aUSDCInstance, EUReInstance);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

async function deployFactory() {
    const [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("UniswapV2Factory");
    const factoryInstance = await factory.deploy(owner.address);
    await factoryInstance.waitForDeployment();
    const factoryAddress = await factoryInstance.getAddress();
    console.log("UniswapFactory deployed to:", factoryAddress);
    return factoryInstance;
}

async function deployWETH() {
    const weth = await ethers.getContractFactory("WETH9");
    const wethInstance = await weth.deploy();
    await wethInstance.waitForDeployment();
    const wethAddress = await wethInstance.getAddress();
    console.log("Weth deployed to:", wethAddress);
    return wethInstance;
}

async function deployRouter(factoryAddress, wethAddress) {
    const router = await ethers.getContractFactory("UniswapV2Router02");
    console.log("Deploying router with factory:", factoryAddress, "and WETH:", wethAddress);
    
    const routerInstance = await router.deploy(factoryAddress, wethAddress);
    
    // Attendre la confirmation avec la nouvelle syntaxe
    await routerInstance.waitForDeployment();
    const routerAddress = await routerInstance.getAddress();
    
    // Vérifier que le code est bien déployé
    const code = await ethers.provider.getCode(routerAddress);
    
    if (code === "0x") {
        throw new Error("Router deployment failed - no code at address");
    }
    
    console.log("UniswapRouter successfully deployed to:", routerAddress);
    return routerInstance;
}

async function deployaUSDT() {
    const aUSDT = await ethers.getContractFactory("aUSDT");
    const aUSDTInstance = await aUSDT.deploy();
    await aUSDTInstance.waitForDeployment();
    const aUSDTAddress = await aUSDTInstance.getAddress();
    console.log("aUSDT deployed to:", aUSDTAddress);
    return aUSDTInstance;
}

async function deployaUSDC() {
    const aUSDC = await ethers.getContractFactory("aUSDC");
    const aUSDCInstance = await aUSDC.deploy();
    await aUSDCInstance.waitForDeployment();
    const aUSDCAddress = await aUSDCInstance.getAddress();
    console.log("aUSDC deployed to:", aUSDCAddress);
    return aUSDCInstance;
}

async function deployEURe() {
    const EURe = await ethers.getContractFactory("EURe");
    const EUReInstance = await EURe.deploy();
    await EUReInstance.waitForDeployment();
    const EUReAddress = await EUReInstance.getAddress();
    console.log("EURe deployed to:", EUReAddress);
    console.log("Amount of EURe to 2nd wallet:", await EUReInstance.balanceOf("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"));
    return EUReInstance;
}

async function createAndAddLiquidity(factory, token0, token1, amount, owner) {
    const token0Address = await token0.getAddress();
    const token1Address = await token1.getAddress();
    
    console.log(`\n----- Creating pool ${await token0.symbol()} / ${await token1.symbol()} -----`);
    
    // Créer la paire
    let pair = await factory.getPair(token0Address, token1Address);
    if (pair === ethers.ZeroAddress) {
        await factory.createPair(token0Address, token1Address);
        pair = await factory.getPair(token0Address, token1Address);
    }
    console.log("Pair address:", pair);

    const PairFactory = await ethers.getContractFactory("UniswapV2Pair");
    const pairContract = PairFactory.attach(pair);

    // Vérifier les LP tokens avant
    const lpBalanceBefore = await pairContract.balanceOf(owner.address);
    console.log("\nLP tokens before:", lpBalanceBefore.toString());

    // Transférer les tokens
    await token0.transfer(pair, amount);
    await token1.transfer(pair, amount);

    // Mint les LP tokens
    const mintTx = await pairContract.mint(owner.address);
    await mintTx.wait();

    // Vérifier l'état final
    const reserves = await pairContract.getReserves();
    const lpBalanceAfter = await pairContract.balanceOf(owner.address);
    
    console.log("\nFinal state:");
    console.log("Reserve0:", reserves[0].toString());
    console.log("Reserve1:", reserves[1].toString());
    console.log("LP tokens before:", lpBalanceBefore.toString());
    console.log("LP tokens after:", lpBalanceAfter.toString());

    // Calculer le pourcentage de la pool
    const totalSupply = await pairContract.totalSupply();
    const ownershipPercentage = (lpBalanceAfter * 10000n) / totalSupply;
    console.log("Pool ownership: ", (Number(ownershipPercentage) / 100).toString() + "%");
}

async function addLiquidity(_uniswapFactory, _uniswapRouter, _aUSDT, _aUSDC, _EURe) {
    const [owner] = await ethers.getSigners();
    const amountTokens = 100000000n;

    // Créer les trois pools
    await createAndAddLiquidity(_uniswapFactory, _aUSDT, _aUSDC, amountTokens, owner);
    await createAndAddLiquidity(_uniswapFactory, _EURe, _aUSDT, amountTokens, owner);
    await createAndAddLiquidity(_uniswapFactory, _EURe, _aUSDC, amountTokens, owner);

    // Afficher un résumé
    console.log("\n----- Summary of all pools -----");
    const pairs = [
        { token0: _aUSDT, token1: _aUSDC },
        { token0: _EURe, token1: _aUSDT },
        { token0: _EURe, token1: _aUSDC }
    ];

    for (const { token0, token1 } of pairs) {
        const pairAddress = await _uniswapFactory.getPair(
            await token0.getAddress(),
            await token1.getAddress()
        );
        console.log(`\n${await token0.symbol()} / ${await token1.symbol()}:`);
        console.log("Pair address:", pairAddress);
    }
}
