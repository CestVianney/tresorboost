const {ethers} = require("hardhat");

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
    return EUReInstance;
}