// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Vault4626 is ERC4626 {
    uint256 public lastUpdateBlock;
    uint256 public yieldRate; 
    constructor(IERC20 asset, uint256 _yieldRate) ERC4626(asset) ERC20("Mock Vault Token", "mVault") {
        yieldRate = _yieldRate; // 10**16 = 1% de rendement par bloc
        lastUpdateBlock = block.number;
    }

    function accrueYield() public {
        uint256 blocksPassed = block.number - lastUpdateBlock;
        if (blocksPassed > 0) {
            uint256 newAssets = (totalAssets() * yieldRate / 1e18) * blocksPassed;
            _mint(address(this), newAssets); 
            lastUpdateBlock = block.number;
        }
    }

    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        accrueYield();
        return super.deposit(assets, receiver);
    }


    function redeem(uint256 shares, address receiver, address owner) public override returns (uint256) {
        accrueYield();
        return super.redeem(shares, receiver, owner);
    }
}
