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
            1200
        );
        await vault.waitForDeployment();

        const Vault4626 = await ethers.getContractFactory("Vault4626");
        const vault4626 = await Vault4626.deploy(
            USDTAddress,
            10**13
        );
        await vault4626.waitForDeployment();

        await tresorBoostCore.waitForDeployment();

        // Mint des tokens pour le test
        const amountEURe = ethers.parseEther("100020000"); // 100M EURe liq, 2k tests
        const amountUSDT = ethers.parseEther("100200000"); // 100M USDT liq, 100k vault
        const amountEURe2 = ethers.parseEther("2000");
        await EURe.mint(owner.address, amountEURe);
        await USDT.mint(owner.address, amountUSDT);
        await EURe.mint(account2.address, amountEURe2);

        await EURe.connect(owner).approve(tresorBoostCore.getAddress(), ethers.parseEther("1000"));
        await farmManager.addFarm(
            true,
            1000,
            2,
            await vault.getAddress(),
            await USDT.getAddress(),
            "deposit(uint256,address)",
            "withdraw(uint256,address)",
            "getMaxWithdraw(address)",
            false
        );

        await farmManager.addFarm(
            true,
            1000,
            2,
            await vault4626.getAddress(),
            await USDT.getAddress(),
            "deposit(uint256,address)",
            "redeem(uint256,address,address)",
            "maxRedeem(address",
            true
        );

        await USDT.mint(tresorBoostCore.getAddress(), ethers.parseEther("100000"));
        await EURe.mint(tresorBoostCore.getAddress(), ethers.parseEther("100000"));

        
        
        await EURe.approve(uniswapRouter.getAddress(), amountEURe);
        await USDT.approve(uniswapRouter.getAddress(), amountUSDT);
        await uniswapRouter.addLiquidity(
            EURe.getAddress(),
            USDT.getAddress(),
            ethers.parseEther("100000000"),
            ethers.parseEther("100000000"),
            0,
            0,
            owner.address,
            Math.floor(Date.now() / 1000) + 60 * 20
        );
        return {
            tresorBoostCore,
            farmManager,
            EURe,
            vault,
            vault4626,
            uniswapFactory,
            uniswapRouter,
            USDT,
            owner,
            account2,
            account3
        };
    }

    let tresorBoostCore, EURe, owner, vault, account2, farmManager, USDT, uniswapRouter;

    beforeEach(async function () {
        const fixture = await loadFixture(deployTresorBoostCoreFixture);
        tresorBoostCore = fixture.tresorBoostCore;
        EURe = fixture.EURe;
        owner = fixture.owner;
        vault = fixture.vault;
        vault4626 = fixture.vault4626;
        account2 = fixture.account2;
        farmManager = fixture.farmManager;
        USDT = fixture.USDT;
        uniswapRouter = fixture.uniswapRouter;
    });

    describe("Deposit", function () {


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
        it("Should update sender deposit infos", async function () {
            const depositInfoBefore = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoBefore.amount).to.equal(0);
            const amount = ethers.parseEther("1000");
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            const depositInfoAfter = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoAfter.amount).to.equal(amount);
        });
        it("Should update sender rewards infos", async function () {
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
        it("Should update sender deposit infos when he already has a deposit", async function () {
            const depositInfoA = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            const amount = ethers.parseEther("1000");
            expect(depositInfoA.amount).to.equal(0);
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                amount
            );
            const depositInfoB = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoB.amount).to.equal(ethers.parseEther("1000"));

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
        it("Should update timestamp infos when user already has a deposit", async function () {
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
        it("Should deposit to vault4626 and user should receive shares", async function () {
            const amount = ethers.parseEther("1000");
            await tresorBoostCore.connect(owner).depositTo(
                await vault4626.getAddress(),
                amount
            );
            const shares = await vault4626.balanceOf(owner.address);
            expect(shares).to.be.gt(0);
        });
        it("Should deposit to vault4626 and shares aren't on the TBC contract", async function () {
            const amount = ethers.parseEther("1000");
            await tresorBoostCore.connect(owner).depositTo(
                await vault4626.getAddress(),
                amount
            );
            const shares = await vault4626.balanceOf(await tresorBoostCore.getAddress());
            expect(shares).to.be.eq(0);
        });
        it("Should emit a Deposit event", async function () {
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
                    ethers.parseEther("5000")
                );
            } catch (error) {
                expect(error.message).to.include("InsufficientBalance");
            }
        });
        it("Should revert if allowance is not enough", async function () {
            try {
                await EURe.mint(account2.address, ethers.parseEther("1000"));
                await EURe.connect(account2).approve(tresorBoostCore.getAddress(), ethers.parseEther("900"));
                await tresorBoostCore.connect(account2).depositTo(
                    await vault.getAddress(),
                    ethers.parseEther("1000")
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
        it("Should revert if user2 didn't approve enough EURe to be spent", async function () {
            try {
                await tresorBoostCore.connect(account2).depositTo(
                    "0x7287C9d0eB221354f1249dE7632d4f557c4D30f8",
                    ethers.parseEther("1000")
                );
            } catch (error) {
                expect(error.message).to.include("ERC20InsufficientAllowance");
            }
        });
    });
    describe("Withdraw", function () {
        beforeEach(async function () {
            const fixture = await loadFixture(deployTresorBoostCoreFixture);
            tresorBoostCore = fixture.tresorBoostCore;
            EURe = fixture.EURe;
            owner = fixture.owner;
            vault = fixture.vault;
            vault4626 = fixture.vault4626;
            account2 = fixture.account2;
            farmManager = fixture.farmManager;
            USDT = fixture.USDT;
            uniswapRouter = fixture.uniswapRouter;

            const eureAmount = ethers.parseEther("2000");
            await EURe.connect(owner).approve(tresorBoostCore.getAddress(), eureAmount);
            await farmManager.addFarm(
                true,
                1000,
                2,
                await vault.getAddress(),
                USDT.getAddress(),
                "deposit(uint256,address)",
                "withdraw(uint256,address)",
                "getMaxWithdraw(address)",
                false
            );

            await farmManager.addFarm(
                true,
                1000,
                2,
                await vault4626.getAddress(),
                USDT.getAddress(),
                "deposit(uint256,address)",
                "redeem(uint256,address,address)",
                "maxRedeem(address)",
                true
            );
            
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                ethers.parseEther("1000")
            );

            await tresorBoostCore.connect(owner).depositTo(
                await vault4626.getAddress(),
                ethers.parseEther("1000")
            );

            await USDT.mint(vault.getAddress(), ethers.parseEther("100000"));
            await USDT.mint(vault4626.getAddress(), ethers.parseEther("100000"));

        });
        it("Should set rewards to 0 in TBC contract when user withdraws any amount", async function () {
            
            await EURe.connect(owner).approve(tresorBoostCore.getAddress(), ethers.parseEther("1"));
            await tresorBoostCore.connect(owner).depositTo(
                await vault.getAddress(),
                ethers.parseEther("1")
            );
            await ethers.provider.send("evm_increaseTime", [31536000]);
            await ethers.provider.send("evm_mine");

            const depositInfoBefore = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoBefore.rewardAmount).to.be.gt(0);
            await tresorBoostCore.connect(owner).withdrawFrom(
                await vault.getAddress(),
                ethers.parseEther("100")
            );
            const depositInfoAfter = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            expect(depositInfoAfter.rewardAmount).to.be.eq(ethers.parseEther("0"));
        });
        it("Should decrease user's balance in TBC contract when he withdraws from vault", async function () {
            const depositInfoBefore = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            const balanceBefore = depositInfoBefore.amount;
            expect(balanceBefore).to.equal(ethers.parseEther("1000"));
            
            await tresorBoostCore.connect(owner).withdrawFrom(
                await vault.getAddress(),
                ethers.parseEther("100")
            );
            
            const depositInfoAfter = await tresorBoostCore.deposits(owner.address, await vault.getAddress());
            const balanceAfter = depositInfoAfter.amount;
            expect(balanceAfter).to.equal(ethers.parseEther("900"));
        });
        it("Should decrease user's balance in TBC contract when he withdraws from vault4626", async function () {
            const depositInfoBefore = await tresorBoostCore.deposits(owner.address, await vault4626.getAddress());
            const balanceBefore = depositInfoBefore.amount;
            expect(balanceBefore).to.equal(ethers.parseEther("1000"));
            
            const shares = await vault4626.balanceOf(owner.address);
            await vault4626.connect(owner).approve(await tresorBoostCore.getAddress(), shares);
            
            await tresorBoostCore.connect(owner).withdrawFrom(
                await vault4626.getAddress(),
                ethers.parseEther("100")
            );
            
            const depositInfoAfter = await tresorBoostCore.deposits(owner.address, await vault4626.getAddress());
            const balanceAfter = depositInfoAfter.amount;
            expect(balanceAfter).to.equal(ethers.parseEther("900"));
        });
        it("Should not receive fees if stake is too short to cover swap losses", async function () {
            await expect(tresorBoostCore.connect(owner).withdrawFrom(vault.getAddress(), ethers.parseEther("1000")
            )).to.emit(tresorBoostCore, "FeesClaimed").withArgs(owner.address, await vault.getAddress(), 0);
        });
        it("Should receive fees if staked for enough time to cover swap losses", async function () {
            await ethers.provider.send("evm_increaseTime", [31536000]);
            await ethers.provider.send("evm_mine");

            const tx = await tresorBoostCore.connect(owner).withdrawFrom(vault.getAddress(), ethers.parseEther("1000"));
            const receipt = await tx.wait();
            
            const feesClaimedEvent = receipt.logs.find(log => {
                try {
                    const parsedLog = tresorBoostCore.interface.parseLog(log);
                    return parsedLog && parsedLog.name === "FeesClaimed";
                } catch (e) {
                    return false;
                }
            });
            
            expect(feesClaimedEvent).to.not.be.undefined;
            const parsedEvent = tresorBoostCore.interface.parseLog(feesClaimedEvent);
            const feesAmount = parsedEvent.args[2];
            
            expect(feesAmount).to.be.gt(ethers.parseEther("1"));
        });
        it("Should revert if user hasn't deposited funds", async function () {
            try {
                await tresorBoostCore.connect(owner).withdrawFrom(await vault.getAddress(), ethers.parseEther("3000"));
            } catch (error) {
                expect(error.message).to.include("InsufficientDepositedFunds");
            }
        });
        it("Should revert if user refuses to sign the approval", async function () {
            try {
                const depositInfoBefore = await tresorBoostCore.deposits(owner.address, await vault4626.getAddress());
                const balanceBefore = depositInfoBefore.amount;
                expect(balanceBefore).to.equal(ethers.parseEther("1000"));
                
                await tresorBoostCore.connect(owner).withdrawFrom(
                    await vault4626.getAddress(),
                    ethers.parseEther("100")
                );
                
                const depositInfoAfter = await tresorBoostCore.deposits(owner.address, await vault4626.getAddress());
                const balanceAfter = depositInfoAfter.amount;
                expect(balanceAfter).to.equal(ethers.parseEther("900"));            
            } catch (error) {
                expect(error.message).to.include("ERC20InsufficientAllowance");
            }
        });
        it("Should revert if user withrawed funds by himself directly in the vault", async function () {
            try {
                await vault.connect(owner).withdraw(ethers.parseEther("500"), owner.address);
                await EURe.connect(account2).approve(tresorBoostCore.getAddress(), ethers.parseEther("1000"));
                await tresorBoostCore.connect(account2).depositTo(
                    await vault.getAddress(),
                    ethers.parseEther("1000")   
                );
            } catch (error) {
                expect(error.message).to.include("Withdraw from vault failed");
            }
        });
    });
    describe("Vaults interactions", function () {
        let mockVault, mockVault4626;
        beforeEach(async function () {
            const fixture = await loadFixture(deployTresorBoostCoreFixture);
            tresorBoostCore = fixture.tresorBoostCore;
            EURe = fixture.EURe;
            owner = fixture.owner;
            vault = fixture.vault;
            USDT = fixture.USDT;
            farmManager = fixture.farmManager;
             

            const MockVault = await ethers.getContractFactory("MockVault");
            mockVault = await MockVault.deploy("MockVault", "MV");
            await mockVault.waitForDeployment();
            const mockVaultAddress = await mockVault.getAddress();

            const MockVault4626 = await ethers.getContractFactory("MockVault");
            mockVault4626 = await MockVault4626.deploy("MockVault", "MV4626");
            await mockVault4626.waitForDeployment();
            const mockVault4626Address = await mockVault4626.getAddress();

            // Mint et approve USDT pour le test
            await USDT.mint(owner.address, ethers.parseEther("1000"));
            await USDT.connect(owner).approve(await tresorBoostCore.getAddress(), ethers.parseEther("1000"));

            // Mint et approve EURe pour le test
            await EURe.mint(owner.address, ethers.parseEther("1000"));
            await EURe.connect(owner).approve(await tresorBoostCore.getAddress(), ethers.parseEther("1000"));

            await farmManager.addFarm(
                true,
                1000,
                2,
                mockVaultAddress,
                await USDT.getAddress(),
                "deposit(uint256,address)",
                "withdraw(uint256,address)",
                "maxWithdraw(address)",
                false
            );

            await farmManager.addFarm(
                true,
                1000,
                2,
                mockVault4626Address,
                await USDT.getAddress(),
                "deposit(uint256,address)",
                "withdraw(uint256,address)",
                "maxWithdraw(address)",
                true
            );
            await mockVault.mint(owner.address, ethers.parseEther("1000"));
            await mockVault.connect(owner).approve(await tresorBoostCore.getAddress(), ethers.parseEther("1000"));

        });
        it("Should revert if vault fails deposit", async function () {
            try {
                await mockVault.setIsDepositRevert(true);
                await tresorBoostCore.connect(owner).depositTo(
                    await mockVault.getAddress(),
                    ethers.parseEther("1000")
                );
            } catch (error) {
                expect(error.message).to.include("Deposit failed");
            }
        });
        it("Should revert if vault fails withdraw", async function () {
            try {
                await tresorBoostCore.connect(owner).depositTo(
                    await mockVault.getAddress(),
                    ethers.parseEther("1000")
                );
                await mockVault.setIsWithdrawRevert(true);
                await tresorBoostCore.connect(owner).withdrawFrom(
                    await mockVault.getAddress(),
                    ethers.parseEther("1000")
                );
            } catch (error) {
                expect(error.message).to.include("Withdraw from vault failed");
            }
        });
        it("Should revert if vault4626 fails withdraw", async function () {
            try {
                await tresorBoostCore.connect(owner).depositTo(
                    await mockVault4626.getAddress(),
                    ethers.parseEther("1000")
                );
                await mockVault4626.setIsWithdrawRevert(true);
                const shares = await mockVault4626.balanceOf(owner.address);
                await mockVault4626.connect(owner).approve(await tresorBoostCore.getAddress(), shares);
                await tresorBoostCore.connect(owner).withdrawFrom(
                    await mockVault4626.getAddress(),
                    ethers.parseEther("10")
                );
            } catch (error) {
                expect(error.message).to.include("Withdraw from vault failed");
            }
        });
        it("Should revert if vault fails getMaxWithdraw", async function () {
            try {
                await tresorBoostCore.connect(owner).depositTo(
                    await mockVault.getAddress(),
                    ethers.parseEther("1000")
                );
                await mockVault.setIsMaxWithdrawRevert(true);
                await tresorBoostCore.connect(owner).withdrawFrom(
                    await mockVault.getAddress(),
                    ethers.parseEther("1000")
                );
            } catch (error) {
                expect(error.message).to.include("Max withdraw failed");
            }
        });
    });
});
