// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockVault is ERC20 {

    bool public isWithdrawRevert;
    bool public isDepositRevert;
    bool public isMaxWithdrawRevert;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function deposit(uint256 amount, address receiver) public returns (uint256) {
        if (isDepositRevert) {
            revert("Deposit failed");
        }
        _mint(receiver, amount);
        return amount;
    }

    function withdraw(uint256 amount, address receiver) public returns (uint256) {
        if (isWithdrawRevert) {
            revert("Withdraw failed");
        }
        _burn(msg.sender, amount);
        return amount;
    }

    function maxWithdraw(address owner) public view returns (uint256) {
        if (isMaxWithdrawRevert) {
            revert("Max withdraw failed");
        }
        return balanceOf(owner);
    }

    function setIsDepositRevert(bool _isDepositRevert) public {
        isDepositRevert = _isDepositRevert;
    }

    function setIsWithdrawRevert(bool _isWithdrawRevert) public {
        isWithdrawRevert = _isWithdrawRevert;
    }

    function setIsMaxWithdrawRevert(bool _isMaxWithdrawRevert) public {
        isMaxWithdrawRevert = _isMaxWithdrawRevert;
    }
}
