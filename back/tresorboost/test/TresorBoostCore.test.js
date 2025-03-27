const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const UniswapV2Factory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const UniswapV2Router02 = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

describe("TresorBoostCore", function () {
    async function deployTresorBoostCoreFixture() {
        const [owner, account2, account3] = await ethers.getSigners();

        // Déployer les tokens de test
        const EUReContractFactory = await ethers.getContractFactory("ERC20Mock");
        const EURe = await EUReContractFactory.deploy("EURO Monerium", "EURe", 18);
        await EURe.waitForDeployment();
        const EUReAddress = await EURe.getAddress();

        const USDTContractFactory = await ethers.getContractFactory("ERC20Mock");
        const USDT = await USDTContractFactory.deploy("Tether USD", "USDT", 6);
        await USDT.waitForDeployment();

        // Déployer FarmManager
        const FarmManager = await ethers.getContractFactory("FarmManager");
        const farmManager = await FarmManager.deploy();
        await farmManager.waitForDeployment();
        const farmManagerAddress = await farmManager.getAddress();

        // Déployer SwapManager
        const SwapManager = await ethers.getContractFactory("SwapManager");
        const swapManager = await SwapManager.deploy();
        await swapManager.waitForDeployment();
        const swapManagerAddress = await swapManager.getAddress();

        // Déployer TresorBoostCore avec tous les arguments requis
        const TresorBoostCore = await ethers.getContractFactory("TresorBoostCore");
        const tresorBoostCore = await TresorBoostCore.deploy(
            farmManagerAddress,
            swapManagerAddress,
            owner.address, // bankAccount
            EUReAddress
        );
        await tresorBoostCore.waitForDeployment();

        // Déployer Factory
        const UniswapFactory = await ethers.getContractFactory(UniswapV2Factory.abi, UniswapV2Factory.bytecode);
        const uniswapFactory = await UniswapFactory.deploy(owner.address);
        await uniswapFactory.waitForDeployment();
        const uniswapFactoryAddress = await uniswapFactory.getAddress();

        // Déployer Router
        const UniswapRouter = await ethers.getContractFactory(UniswapV2Router02.abi, UniswapV2Router02.bytecode);
        const uniswapRouter = await UniswapRouter.deploy(uniswapFactoryAddress, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
        await uniswapRouter.waitForDeployment();

        // Mint des tokens pour le test
        const amountEURe = ethers.parseEther("10000"); // 10000 EURe
        const amountUSDT = ethers.parseUnits("10000", 6); // 10000 USDT (6 décimales)

        await EURe.mint(owner.address, amountEURe);
        await USDT.mint(owner.address, amountUSDT);
        
        return { 
            tresorBoostCore, 
            farmManager, 
            swapManager, 
            EURe,
            uniswapFactory, 
            uniswapRouter, 
            USDT,
            owner, 
            account2, 
            account3 
        };
    }

    beforeEach(async function () {
        const { tresorBoostCore, farmManager, swapManager, EURe, USDT, owner, account2, account3 } = await loadFixture(deployTresorBoostCoreFixture);
        
        farmManager.addFarm(
            true,
            100,
            tresorBoostCore.getAddress(),
            EURe.getAddress(),
            USDT.getAddress(),
            "deposit(uint256)",
            "withdraw(uint256)",
            "claim()"
        );

    });

    it("should deploy the contract", async function () {
        const { tresorBoostCore } = await loadFixture(deployTresorBoostCoreFixture);
        expect(await tresorBoostCore.getAddress()).to.be.properAddress;
    });

    it("should have working Uniswap imports", async function () {
        const { uniswapRouter, uniswapFactory, EURe, USDT } = await loadFixture(deployTresorBoostCoreFixture);
        
        // Vérifier que le Router est bien attaché
        expect(await uniswapRouter.getAddress()).to.be.properAddress;
        
        // Vérifier que le Factory est bien attaché
        expect(await uniswapFactory.getAddress()).to.be.properAddress;
        
        // Vérifier que le Router peut appeler une fonction simple
        const factoryAddress = await uniswapRouter.factory();
        expect(factoryAddress).to.equal(await uniswapFactory.getAddress());

        // Vérifier que les tokens sont bien attachés
        expect(await EURe.getAddress()).to.be.properAddress;
        expect(await USDT.getAddress()).to.be.properAddress;
    });

    it("should add liquidity to EURe/USDT pool", async function () {
        const { uniswapFactory, uniswapRouter, EURe, USDT, owner } = await loadFixture(deployTresorBoostCoreFixture);
        
        // Montants pour l'ajout de liquidité (en wei)
        const amountEURe = ethers.parseEther("1000"); // 1000 EURe
        const amountUSDT = ethers.parseUnits("1000", 6); // 1000 USDT (6 décimales)

        // Approuver le Router pour dépenser les tokens
        await EURe.approve(uniswapRouter.getAddress(), amountEURe);
        await USDT.approve(uniswapRouter.getAddress(), amountUSDT);

        // Ajouter la liquidité
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
        const tx = await uniswapRouter.addLiquidity(
            EURe.getAddress(),
            USDT.getAddress(),
            amountEURe,
            amountUSDT,
            0, // amountEUReMin
            0, // amountUSDTMin
            owner.address,
            deadline
        );

        // Vérifier que la transaction a réussi
        await expect(tx.wait()).to.not.be.reverted;

        // Vérifier que la paire existe
        const pairAddress = await uniswapFactory.getPair(EURe.getAddress(), USDT.getAddress());
        expect(amountEURe).to.equal(await EURe.balanceOf(pairAddress));
        expect(amountUSDT).to.equal(await USDT.balanceOf(pairAddress));
        expect(pairAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("should swap EURe for USDT", async function () {
        const { uniswapRouter, EURe, USDT, owner } = await loadFixture(deployTresorBoostCoreFixture);
        
        // D'abord, ajouter de la liquidité
        const liquidityEURe = ethers.parseEther("1000"); // 1000 EURe
        const liquidityUSDT = ethers.parseUnits("1000", 6); // 1000 USDT

        await EURe.approve(uniswapRouter.getAddress(), liquidityEURe);
        await USDT.approve(uniswapRouter.getAddress(), liquidityUSDT);

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
        await uniswapRouter.addLiquidity(
            EURe.getAddress(),
            USDT.getAddress(),
            liquidityEURe,
            liquidityUSDT,
            0,
            0,
            owner.address,
            deadline
        );

        // Maintenant, faire le swap
        const amountIn = ethers.parseEther("100"); // 100 EURe

        // Approuver le Router pour dépenser EURe
        await EURe.approve(uniswapRouter.getAddress(), amountIn);

        // Préparer le chemin du swap
        const path = [EURe.getAddress(), USDT.getAddress()];

        // Obtenir le montant minimum de sortie
        const amounts = await uniswapRouter.getAmountsOut(amountIn, path);
        const amountOutMin = amounts[1] * BigInt(95) / BigInt(100); // 95% du montant attendu

        // Effectuer le swap
        const tx = await uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            owner.address,
            deadline
        );

        // Vérifier que la transaction a réussi
        await expect(tx.wait()).to.not.be.reverted;

        // Vérifier que le solde USDT a augmenté
        const balanceAfter = await USDT.balanceOf(owner.address);
        expect(balanceAfter).to.be.gt(0);
    });
});