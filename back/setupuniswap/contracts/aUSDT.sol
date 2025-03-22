// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract aUSDT is ERC20 {
    constructor() ERC20("Alyra USDT", "aUSDT") {
        _mint(msg.sender, 1000000000000000000000000);
    }
}