const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault4626", function () {
    async function deployVaultFixture() {
        const [owner, account2] = await ethers.getSigners();
        const AUSDT = await ethers.getContractFactory("ERC20Mock");
        const aUSDT = await AUSDT.deploy("Alyra USDT", "AUSDT", 18);
        await aUSDT.waitForDeployment();
        const Vault4626 = await ethers.getContractFactory("Vault4626");
        const vault4626 = await Vault4626.deploy(aUSDT.target, 1000);
        await vault4626.waitForDeployment();
        await aUSDT.mint(account2.address, ethers.parseEther("100000"));
        await aUSDT.connect(account2).approve(vault4626.target, ethers.parseEther("100000"));
        await vault4626.connect(account2).deposit(ethers.parseEther("100000"), account2.address);
        return { owner, account2, vault4626, aUSDT };
    }

    describe("Vault4626", function () {
        let owner, vault4626, aUSDT;
        beforeEach(async function () {
            const fixture = await loadFixture(deployVaultFixture);
            owner = fixture.owner;
            vault4626 = fixture.vault4626;
            aUSDT = fixture.aUSDT;
        });
        it("Should increase interests balance while deposing once and later", async function () {
            await aUSDT.mint(owner.address, ethers.parseEther("200"));
            await aUSDT.connect(owner).approve(vault4626.target, ethers.parseEther("1000000"));
            await vault4626.connect(owner).deposit(ethers.parseEther("100"), owner.address);
           
            const interestsBefore = await vault4626.pendingInterests(owner.address);
            console.log("Interests before:", interestsBefore.toString());
            expect(interestsBefore).to.equal(0);

            await ethers.provider.send("evm_increaseTime", [86400 * 365]); // 1 jour en secondes
            await ethers.provider.send("evm_mine");

            await vault4626.connect(owner).deposit(ethers.parseEther("100"), owner.address);
            const interestsAfter = await vault4626.pendingInterests(owner.address);
            console.log("Interests after:", interestsAfter.toString());
            expect(interestsAfter).to.be.gt(0);
        });
        it("Should grand interests over time", async function () {
            await aUSDT.mint(owner.address, ethers.parseEther("100"));
            await aUSDT.mint(vault4626.target, ethers.parseEther("100000"));
            await aUSDT.connect(owner).approve(vault4626.target, ethers.parseEther("1000000"));
            await vault4626.connect(owner).deposit(ethers.parseEther("100"), owner.address);
            
            // Attendre 1 jour
            await ethers.provider.send("evm_increaseTime", [86400]); // 1 jour en secondes
            await ethers.provider.send("evm_mine");
            
            // Récupérer toutes les shares
            const shares = await vault4626.balanceOf(owner.address);
            await vault4626.connect(owner).redeem(shares, owner.address, owner.address);
            
            const balance = await aUSDT.balanceOf(owner.address);
            console.log("Balance:", balance.toString());
            expect(balance).to.be.gt(ethers.parseEther("100"));
        });
        it("MaxRedeem should return the correct amount", async function () {
            const redeemBefore = await vault4626.maxRedeem(owner.address);
            console.log("Redeem before:", redeemBefore.toString());
            expect(redeemBefore).to.equal(0);
            await aUSDT.mint(owner.address, ethers.parseEther("100"));
            await aUSDT.mint(vault4626.target, ethers.parseEther("100000"));
            await aUSDT.connect(owner).approve(vault4626.target, ethers.parseEther("100"));
            await vault4626.connect(owner).deposit(ethers.parseEther("100"), owner.address);

            await ethers.provider.send("evm_increaseTime", [86400]); // 1 jour en secondes
            await ethers.provider.send("evm_mine");

            const maxRedeem = await vault4626.maxRedeem(owner.address);
            console.log("Max redeem:", maxRedeem.toString());
            expect(maxRedeem).to.be.gt(0);
        });
        it("Should have no interests if two deposits are made in a row", async function () {
            const MockUse4626 = await ethers.getContractFactory("MockUse4626");
            const mockUse4626 = await MockUse4626.deploy(vault4626.target);
            await mockUse4626.waitForDeployment();
            
            // Récupérer le token du vault
            const vaultAsset = await vault4626.asset();
            const vaultToken = await ethers.getContractAt("ERC20Mock", vaultAsset);
            
            // Mint des tokens à l'owner
            await vaultToken.mint(owner.address, ethers.parseEther("200"));
            
            const interests = await vault4626.pendingInterests(owner.address);
            console.log("Interests:", interests.toString());
            expect(interests).to.equal(0);
            
            // Approve le MockUse4626 pour utiliser les tokens de l'owner
            await vaultToken.connect(owner).approve(vault4626.target, ethers.parseEther("200"));
            await vaultToken.connect(owner).approve(mockUse4626.target, ethers.parseEther("200"));


            await mockUse4626.connect(owner).doubleDeposit(ethers.parseEther("100"), owner.address);
            const interestsAfter = await vault4626.pendingInterests(owner.address);
            console.log("Interests after:", interestsAfter.toString());
            expect(interestsAfter).to.equal(0);
        });
        it("Should revert if redeem is called with 0 shares", async function () {
            await expect(vault4626.connect(owner).redeem(0, owner.address, owner.address)).to.be.revertedWith("ZERO_SHARES");
        });
    });
});
