// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FarmManager.sol";
import "./SwapManager.sol";

contract TresorBoostCore is Ownable {
    event Deposit(address indexed user, address indexed pool, uint256 amount);
    event Withdraw(address indexed user, address indexed pool, uint256 amount);
    
    mapping(address => mapping(address => uint256)) public deposits;
    FarmManager private farmManager; 
    SwapManager private swapManager;
    address public bankAccount;

    constructor(address _farmManager, address _swapManager, address _bankAccount) Ownable(msg.sender) {
        farmManager = FarmManager(_farmManager);
        swapManager = SwapManager(_swapManager);
        bankAccount = _bankAccount;
    }

    function depositTo(address _toPool, uint256 _amount) public {
        deposits[msg.sender][_toPool] += _amount;
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_toPool);
        bytes memory depositData = abi.encodeWithSelector(farmInfo.depositSelector, _amount);
        (bool depositResult,) = _toPool.call(depositData);
        require(depositResult, "Deposit failed");
    }

    function withdrawFrom(address _fromPool, uint256 _amount) public {
        deposits[msg.sender][_fromPool] -= _amount;
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_fromPool);
        bytes memory withdrawData = abi.encodeWithSelector(farmInfo.withdrawSelector, _amount);
        (bool withdrawResult,) = _fromPool.call(withdrawData);
        require(withdrawResult, "Withdraw failed");
    }
}
