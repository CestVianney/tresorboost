// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SwapManager is Ownable {

    struct SwapInfo {
        address swapAddress;
        address tokenOut;
        bytes4 swapSelector;
        bool isActive;
    }

    mapping(address => mapping(address => SwapInfo)) internal swapsForToken;

    constructor() Ownable(msg.sender) {}

    function addSwap(address _tokenIn, address _tokenOut, address _swapAddress, string memory _swapFunction) public onlyOwner {
        swapsForToken[_tokenIn][_tokenOut] = SwapInfo({
            swapAddress: _swapAddress,
            tokenOut: _tokenOut,
            swapSelector: bytes4(keccak256(bytes(_swapFunction))),
            isActive: true
        });
    }

    function getSwapInfo(address _tokenIn, address _tokenOut) public view returns (SwapInfo memory) {
        return swapsForToken[_tokenIn][_tokenOut];
    }

    function setSwapInfo(address _tokenIn, address _tokenOut, SwapInfo memory _swapInfo) public onlyOwner {
        swapsForToken[_tokenIn][_tokenOut] = _swapInfo;
    }
}
