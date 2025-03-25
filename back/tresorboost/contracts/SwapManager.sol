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

    mapping(address => SwapInfo) internal swapsForToken;

    constructor(address _owner) Ownable(_owner) {}

    function addSwap(address _swapAddress, address _tokenOut, string memory _swapFunction) public onlyOwner {
        swapsForToken[_swapAddress] = SwapInfo({
            swapAddress: _swapAddress,
            tokenOut: _tokenOut,
            swapSelector: bytes4(keccak256(bytes(_swapFunction))),
            isActive: true
        });
    }

    function getSwapInfo(address _swapAddress) public view returns (SwapInfo memory) {
        return swapsForToken[_swapAddress];
    }

    function setSwapInfo(address _swapAddress, SwapInfo memory _swapInfo) public onlyOwner {
        swapsForToken[_swapAddress] = _swapInfo;
    }
}
