const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { constants } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const UniswapV2Factory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const UniswapV2Router02 = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

describe("TresorBoostCore", function () {
    async function deployTresorBoostCoreFixture() {
        const [owner, account2, account3] = await ethers.getSigners();

        // Déployer Factory
        const UniswapFactory = await ethers.getContractFactory(UniswapV2Factory.abi, UniswapV2Factory.bytecode);
        const uniswapFactory = await UniswapFactory.deploy(owner.address);
        await uniswapFactory.waitForDeployment();
        const uniswapFactoryAddress = await uniswapFactory.getAddress();

        // Déployer Router
        const UniswapRouter = await ethers.getContractFactory(UniswapV2Router02.abi, UniswapV2Router02.bytecode);
        const uniswapRouter = await UniswapRouter.deploy(uniswapFactoryAddress, "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3");
        await uniswapRouter.waitForDeployment();
        const uniswapRouterAddress = await uniswapRouter.getAddress();

        // Déployer les tokens de test
        const EUReContractFactory = await ethers.getContractFactory("ERC20Mock");
        const EURe = await EUReContractFactory.deploy("EURO Monerium", "EURe", 18);
        await EURe.waitForDeployment();
        const EUReAddress = await EURe.getAddress();

        const USDTContractFactory = await ethers.getContractFactory("ERC20Mock");
        const USDT = await USDTContractFactory.deploy("Tether USD", "USDT", 6);
        await USDT.waitForDeployment();
        const USDTAddress = await USDT.getAddress();

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
            owner.address, // bankAccount
            EUReAddress,
            uniswapRouterAddress
        );

        // Déployer Vault
        const Vault = await ethers.getContractFactory("Vault");
        const vault = await Vault.deploy(
            USDTAddress,
            1000
        );
        await vault.waitForDeployment();
        const vaultAddress = await vault.getAddress();

        await tresorBoostCore.waitForDeployment();

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
            vault,
            uniswapFactory,
            uniswapRouter,
            USDT,
            owner,
            account2,
            account3
        };
    }

    beforeEach(async function () {
        const { vault, tresorBoostCore, farmManager, swapManager, EURe, USDT, owner, account2, account3 } = await loadFixture(deployTresorBoostCoreFixture);
        await EURe.connect(owner).approve(tresorBoostCore.getAddress(), ethers.parseEther("1000"));
        await farmManager.addFarm(
            true,
            1000,
            2,
            await vault.getAddress(),
            EURe.getAddress(),
            constants.ZERO_ADDRESS,
            "deposit(uint256)",
            "withdraw(uint256)",
            "claim()"
        );
        
        const farmInfoAfter = await farmManager.getFarmInfo(await vault.getAddress());
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
        expect(await uniswapFactory.getAddress()).to.be.properAddress

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

    describe("Deposit", function () {
        let tresorBoostCore, EURe, owner, vault, account2, farmManager, USDT, uniswapRouter;

        beforeEach(async function () {
            const fixture = await loadFixture(deployTresorBoostCoreFixture);
            tresorBoostCore = fixture.tresorBoostCore;
            EURe = fixture.EURe;
            owner = fixture.owner;
            vault = fixture.vault;
            account2 = fixture.account2;
            farmManager = fixture.farmManager;
            USDT = fixture.USDT;
            uniswapRouter = fixture.uniswapRouter;  

            await EURe.approve(uniswapRouter.getAddress(), ethers.parseEther("1000"));
            await USDT.approve(uniswapRouter.getAddress(), ethers.parseUnits("1000", 6));
            await uniswapRouter.addLiquidity(
                EURe.getAddress(),
                USDT.getAddress(),
                ethers.parseEther("1000"),
                ethers.parseUnits("1000", 6),
                0,
                0,
                owner.address,
                Math.floor(Date.now() / 1000) + 60 * 20
            );
            
            await EURe.connect(owner).approve(tresorBoostCore.getAddress(), ethers.parseEther("1000"));
            await farmManager.addFarm(
                true,
                1000,
                2,
                await vault.getAddress(),
                USDT.getAddress(),
                constants.ZERO_ADDRESS,
                "deposit(uint256)",
                "withdraw(uint256)",
                "claim()"
            );
        });

        it("Should take 1000 EURe from sender and deposit to the vault", async function () {
            const balanceBefore = await EURe.balanceOf(owner.address);
            const amount = ethers.parseEther("1000");
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            const balanceAfter = await EURe.balanceOf(owner.address);
            expect(balanceAfter).to.equal(balanceBefore - amount);
        });
        it("Should update sender deposit infos", async function() {
            const depositInfoBefore = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoBefore.amount).to.equal(0);
            const amount = ethers.parseEther("1000");
            // expect(depositInfoBefore.amount).to.equal(0);
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            const depositInfoAfter = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoAfter.amount).to.equal(amount);
        });
        it("Should update sender rewards infos", async function() {
            const depositInfoBefore = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            const amount = ethers.parseEther("1000");
            expect(depositInfoBefore.rewardAmount).to.equal(0);
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            //wait for 1 year in blockchain time
            await ethers.provider.send("evm_increaseTime", [31536000]);
            await ethers.provider.send("evm_mine");
            await EURe.connect(owner).approve(tresorBoostCore.getAddress(), ethers.parseEther("1000"));

            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            const depositInfoAfter = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoAfter.rewardAmount).to.be.gt(ethers.parseEther("100"));
            expect(depositInfoAfter.rewardAmount).to.be.lt(ethers.parseEther("101"));
        });
        it("Should update sender deposit infos when he already has a deposit", async function() {
            const depositInfoA = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            const amount = ethers.parseEther("1000");
            expect(depositInfoA.amount).to.equal(0);
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            const depositInfoB = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoB.amount).to.equal(ethers.parseEther("1000"));
            //wait for 1 year in blockchain time
            await ethers.provider.send("evm_increaseTime", [31536000]);
            await ethers.provider.send("evm_mine");
            await EURe.connect(owner).approve(tresorBoostCore.getAddress(), ethers.parseEther("1000"));

            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            const depositInfoC = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoC.amount).to.equal(ethers.parseEther("2000"));
        });
        it("Should update timestamp infos when user already has a deposit", async function() {
            const depositInfoA = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            const amount = ethers.parseEther("1000");
            const timestampBefore = await ethers.provider.getBlock('latest').then(block => block.timestamp);
            expect(depositInfoA.lastTimeRewardCalculated).to.equal(0); // Au début, c'est 0 car pas encore de dépôt
            
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            const depositInfoB = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoB.lastTimeRewardCalculated).to.be.gt(timestampBefore);

            //wait for 1 year in blockchain time
            await ethers.provider.send("evm_increaseTime", [31536000]);
            await ethers.provider.send("evm_mine");
            const timestampAfterYear = await ethers.provider.getBlock('latest').then(block => block.timestamp);
            
            await EURe.connect(owner).approve(tresorBoostCore.getAddress(), ethers.parseEther("1000"));
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            const depositInfoC = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoC.lastTimeRewardCalculated).to.be.gt(timestampAfterYear);
        });
        it("Should emit a Deposit event", async function() {
            const amount = ethers.parseEther("1000");
            await expect(tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            )).to.emit(tresorBoostCore, "Deposit").withArgs(owner.address, await vault.getAddress(), amount);
        });
        it("Should revert if wallet hasn't enough EURe", async function () {
            try {
                await tresorBoostCore.connect(account2).depositTo(
                    await vault.getAddress(),
                    ethers.parseEther("1000") // Utiliser parseEther au lieu d'un nombre brut
                );
            } catch (error) {
                expect(error.message).to.include("InsufficientBalance()");
            }
        });
        it("Should revert if allowance is not enough", async function () {
            try {
                await EURe.mint(account2.address, ethers.parseEther("1000"));
                await EURe.connect(account2).approve(tresorBoostCore.getAddress(), ethers.parseEther("900"));
                await tresorBoostCore.connect(account2).depositTo(
                    await vault.getAddress(),
                    ethers.parseEther("1000") // Utiliser parseEther au lieu d'un nombre brut
                );
            } catch (error) {
                expect(error.message).to.include("ERC20InsufficientAllowance");
            }
        });
        it("Should revert if farm is not active", async function () {
            try {
                await EURe.approve(tresorBoostCore.getAddress(), ethers.parseEther("1000"));
                await tresorBoostCore.depositTo(
                    "0x7287C9d0eB221354f1249dE7632d4f557c4D30f8",
                    ethers.parseEther("1000")
                );
            } catch (error) {
                expect(error.message).to.include("InactiveFarm");
            }
        });
        it("Should aaaaa", async function () {
            try {
                await EURe.approve(tresorBoostCore.getAddress(), ethers.parseEther("1000"));
                await tresorBoostCore.depositTo(
                    await vault.getAddress(),
                    ethers.parseEther("1000")
                );
            } catch (error) {
                console.log(error);
                console.log("----------------------------------------------------------------------------------------");
                expect(error.message).to.include("InactiveFarm");
            }
        });
    });
});
