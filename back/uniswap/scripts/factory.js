const {ethers} = require("hardhat");

const main = async () => {

console.log("-----------------------------DEPLOY UNISWAP FACTORY---------------------------------");
const factoryInstance = await deployFactory();
console.log("-----------------------------DEPLOY WETH---------------------------------");
const wethInstance = await deployWETH();
console.log("------------------------------DEPLOY UNISWAP ROUTER--------------------------------");
const factoryAddress = await factoryInstance.getAddress();
const wethAddress = await wethInstance.getAddress();
const routerInstance = await deployRouter(factoryAddress, wethAddress);
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
    const [owner] = await ethers.getSigners();
    const router = await ethers.getContractFactory("UniswapV2Router02");
    const routerInstance = await router.deploy(factoryAddress, wethAddress);
    await routerInstance.waitForDeployment();
    const routerAddress = await routerInstance.getAddress();
    console.log("UniswapRouter deployed to:", routerAddress);
    return routerInstance;
}