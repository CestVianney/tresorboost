// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IMintableERC20 is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract Vault4626 is ERC4626 {
    uint256 public lastUpdateTime;
    uint256 public yieldRate; 
    
    mapping(address => uint256) public depositTime;
    mapping(address => uint256) public pendingInterests;
    
    constructor(IERC20 asset, uint256 _yieldRate) ERC4626(asset) ERC20("Mock Vault Token", "mVault") {
        yieldRate = _yieldRate; 
        lastUpdateTime = block.timestamp;
    }

    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        uint256 currentShares = balanceOf(receiver);
        console.log("Current shares:", currentShares);
        if (currentShares > 0) {
            _updateInterest(receiver);
        }
        
        depositTime[receiver] = block.timestamp;
        uint256 shares = super.deposit(assets, receiver);
        return shares;
    }

    function redeem(uint256 shares, address receiver, address owner) public override returns (uint256) {
        require(shares > 0, "ZERO_SHARES");
        console.log("Shares:", shares);
        _updateInterest(receiver);
        console.log("Pending interests:", pendingInterests[receiver]);
        uint256 baseAssets = super.previewRedeem(shares);        
        console.log("Base assets:", baseAssets);
        uint256 rewards = pendingInterests[receiver];
        console.log("Rewards:", rewards);
        _burn(owner, shares);
        console.log("Burned shares:", shares);
        IERC20(asset()).transfer(receiver, baseAssets);
        console.log("Transferred assets:", baseAssets);
        if (rewards > 0) {
            pendingInterests[receiver] = 0;
            console.log("Pending interests after redemption:", pendingInterests[receiver]);
            depositTime[receiver] = block.timestamp;
            console.log("Deposit time after redemption:", depositTime[receiver]);
            IERC20(asset()).transfer(receiver, rewards);
            console.log("Transferred rewards:", rewards);
        }
        console.log("Total assets:", baseAssets + rewards);
        return baseAssets + rewards;
    }

    function _calculateInterest(address account) internal view returns (uint256) {
        uint256 timePassed = block.timestamp - depositTime[account];
        uint256 baseAssets = super.previewRedeem(balanceOf(account));
        uint256 interest = (baseAssets * yieldRate * timePassed) / (365 days * 10000);
        return interest;
    }

    function _updateInterest(address account) internal {
        uint256 interest = _calculateInterest(account);
        if (interest > 0) {
            // Mint de nouveaux tokens pour les intérêts
            IMintableERC20(asset()).mint(address(this), interest);
            pendingInterests[account] += interest;
            depositTime[account] = block.timestamp;
        }
    }

    function maxRedeem(address owner) public view override returns (uint256) {
        // On vérifie les shares du receiver car à ce moment les shares n'ont pas encore été transférées à l'owner
        address receiver = owner;  // owner est en fait le receiver à ce stade
        return balanceOf(receiver);
    }

    function maxRedeemForReceiver(address receiver) public view returns (uint256) {
        return balanceOf(receiver);
    }
}
