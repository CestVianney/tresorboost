// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SwapManager is Ownable {

    struct SwapInfo {
        address swapAddress;
        address tokenA;
        address tokenB;
        bytes4 swapSelector;
        bool isActive;
    }

    mapping(address => mapping(address => SwapInfo)) internal swapsForToken;

    constructor() Ownable(msg.sender) {}

    function _sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "Identical addresses");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Zero address");
    }

    function addSwap(address _tokenA, address _tokenB, address _swapAddress, string memory _swapFunction) public onlyOwner {
        (address token0, address token1) = _sortTokens(_tokenA, _tokenB);
        
        swapsForToken[token0][token1] = SwapInfo({
            swapAddress: _swapAddress,
            tokenA: token0,
            tokenB: token1,
            swapSelector: bytes4(keccak256(bytes(_swapFunction))),
            isActive: true
        });
    }

    function getSwapInfo(address _tokenA, address _tokenB) public view returns (SwapInfo memory) {
        (address token0, address token1) = _sortTokens(_tokenA, _tokenB);
        return swapsForToken[token0][token1];
    }

    function setSwapInfo(address _tokenA, address _tokenB, SwapInfo memory _swapInfo) public onlyOwner {
        (address token0, address token1) = _sortTokens(_tokenA, _tokenB);
        swapsForToken[token0][token1] = _swapInfo;
    }
}
