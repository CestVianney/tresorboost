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

    // Simule une croissance des assets dans le vault
    function accrueYield() public {
        uint256 blocksPassed = block.number - lastUpdateBlock;
        if (blocksPassed > 0) {
            uint256 newAssets = (totalAssets() * yieldRate / 1e18) * blocksPassed;
            _mint(address(this), newAssets); // Ajoute les intérêts directement au vault
            lastUpdateBlock = block.number;
        }
    }

    // Override deposit pour ajouter la simulation de yield
    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        accrueYield();
        return super.deposit(assets, receiver);
    }

    // Override withdraw pour simuler la croissance des assets
    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) {
        accrueYield();
        return super.withdraw(assets, receiver, owner);
    }
}
