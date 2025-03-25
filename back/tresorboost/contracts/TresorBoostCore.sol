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

    function depositTo(address _toContract, uint256 _amount) public {
        require(farmManager.getFarmInfo(_toContract).isActive, "Pool is not active");
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_toContract);
        require(swapManager.getSwapInfo(farmInfo.depositToken).isActive, "Swap is not active");
        if(farmInfo.rewardToken != address(0)) {
            require(swapManager.getSwapInfo(farmInfo.rewardToken).isActive, "Swap is not active");
        }

        SwapManager.SwapInfo memory swapInfo = swapManager.getSwapInfo(farmInfo.depositToken);
        bytes memory swapData = abi.encodeWithSelector(swapInfo.swapSelector, _amount);
        (bool swapResult,) = swapInfo.swapAddress.call(swapData);
        require(swapResult, "Swap failed");

        bytes memory depositData = abi.encodeWithSelector(farmInfo.depositSelector, _amount);
        (bool depositResult,) = _toContract.call(depositData);
        require(depositResult, "Deposit failed");
        deposits[msg.sender][_toContract] += _amount;
    }

    function withdrawFrom(address _fromContract, uint256 _amount) public {
        deposits[msg.sender][_fromContract] -= _amount;
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_fromContract);
        bytes memory withdrawData = abi.encodeWithSelector(farmInfo.withdrawSelector, _amount);
        (bool withdrawResult,) = _fromContract.call(withdrawData);
        require(withdrawResult, "Withdraw failed");
    }
}
