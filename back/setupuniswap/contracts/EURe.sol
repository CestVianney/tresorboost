// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EURe is ERC20 {
    constructor() ERC20("Monerium EURe", "EURe") {
        _mint(msg.sender, 1000000000000000000000000);
        _mint(address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8), 100000);
    }
}