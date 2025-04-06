// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "../Vault4626.sol";
import "hardhat/console.sol";

contract MockUse4626 {
    Vault4626 public vault;
    address vaultAddress;
    ERC20 asset;
    constructor(address _vaultAddress) {
        vault = Vault4626(_vaultAddress);
        vaultAddress = _vaultAddress;
        asset = ERC20(vault.asset());
    }

    function depositAndRedeem(uint256 amount, address receiver) public returns (uint256) {
        vault.deposit(amount, receiver);
        return vault.redeem(vault.balanceOf(receiver), receiver, receiver);
    }

function doubleDeposit(uint256 amount, address receiver) public returns (uint256) {
    require(asset.transferFrom(msg.sender, address(this), 2 * amount), "Transfer failed");

    asset.approve(address(vault), 2 * amount);
    vault.deposit(amount, receiver);
    vault.deposit(amount, receiver);

    return vault.balanceOf(receiver);
}  
}