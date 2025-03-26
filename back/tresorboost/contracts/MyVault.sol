// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyVault {

    mapping(address => uint256) public balances;

    function deposit(uint256 amount) external {
        balances[msg.sender] += amount;
    }

    function withdraw(uint256 amount) external {
        balances[msg.sender] -= amount;
    }
    
}

