// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    uint8 private _customDecimals;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _customDecimals = decimals_;
    }

    /// @notice Public minting for test purposes
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Override decimals to use custom value
    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }
}