// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FarmManager.sol";
import "./SwapManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TresorBoostCore is Ownable {

    struct DepositInfo {
        address pool;
        uint256 amount;
        uint256 rewardAmount;
        uint256 lastTimeRewardCalculated;
    }

    event Deposit(address indexed user, address indexed pool, uint256 amount);
    event Withdraw(address indexed user, address indexed pool, uint256 amount);
    
    mapping(address => mapping(address => DepositInfo)) public deposits;

    FarmManager private farmManager; 
    SwapManager private swapManager;
    address public bankAccount;
    address public eureToken;

    constructor(address _farmManager, address _swapManager, address _bankAccount, address _eureToken) Ownable(msg.sender) {
        farmManager = FarmManager(_farmManager);
        swapManager = SwapManager(_swapManager);
        bankAccount = _bankAccount;
        eureToken = _eureToken;
    }

    function depositTo(address _toContract, uint256 _amount) public {
        require(IERC20(eureToken).balanceOf(msg.sender) >= _amount);
        require(IERC20(eureToken).transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        require(farmManager.getFarmInfo(_toContract).isActive, "Farm is not active");
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_toContract);
        SwapManager.SwapInfo memory swapInfo = swapManager.getSwapInfo(eureToken, farmInfo.depositToken);
        require(swapInfo.isActive, "Swap is not active");


        //TODO : finish swap feature
        bytes memory swapData = abi.encodeWithSelector(swapInfo.swapSelector, _amount);
        (bool swapResult,) = swapInfo.swapAddress.call(swapData);
        require(swapResult, "Swap failed");

        bytes memory depositData = abi.encodeWithSelector(farmInfo.depositSelector, _amount);
        (bool depositResult,) = _toContract.call(depositData);
        require(depositResult, "Deposit failed");
        DepositInfo memory depositInfo = deposits[msg.sender][_toContract];
        deposits[msg.sender][_toContract] = DepositInfo({
            pool: _toContract,
            amount: depositInfo.amount + _amount,
            rewardAmount: depositInfo.rewardAmount,
            lastTimeRewardCalculated: block.timestamp
        });
    }

    function withdrawFrom(address _fromContract, uint256 _amount) public {
        updateRewards(_fromContract);
        DepositInfo memory depositInfo = deposits[msg.sender][_fromContract];

        require(depositInfo.amount  >= _amount, "Insufficient balance");
        uint256 totalDuedAmount = _amount + depositInfo.rewardAmount;

        uint fees = 0;
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_fromContract);
        bytes memory withdrawData = abi.encodeWithSelector(farmInfo.withdrawSelector, _amount);
        (bool withdrawResult, bytes memory returnedWithdrawData) = _fromContract.call(withdrawData);
        require(withdrawResult, "Withdraw failed");
        uint withdrawAmount = abi.decode(returnedWithdrawData, (uint256));

        if(farmInfo.claimSelector != bytes4(0)) {
            bytes memory claimData = abi.encodeWithSelector(farmInfo.claimSelector);
            (bool claimResult, bytes memory returnedClaimData) = _fromContract.call(claimData);
            require(claimResult, "Claim failed");
            uint claimedAmount = abi.decode(returnedClaimData, (uint256));
            fees = claimedAmount - depositInfo.rewardAmount;
        } else {
            fees = withdrawAmount - totalDuedAmount;
        }

        //TODO : Manage swap here

        deposits[msg.sender][_fromContract] = DepositInfo({
            pool: _fromContract,
            amount: depositInfo.amount - _amount,
            rewardAmount: 0,
            lastTimeRewardCalculated: block.timestamp
        });

        

       require(IERC20(eureToken).transfer(msg.sender, totalDuedAmount), "Transfer failed");
       require(IERC20(eureToken).transfer(bankAccount, fees), "Transfer failed");
    }

    function updateRewards(address _pool) private view {
        DepositInfo memory depositInfo = deposits[msg.sender][_pool];
        if(depositInfo.lastTimeRewardCalculated == 0) {
            return;
        }
        uint256 timeSinceLastReward = block.timestamp - depositInfo.lastTimeRewardCalculated;
        uint256 rewardAmount = (depositInfo.amount * farmManager.getFarmInfo(_pool).rewardRate * timeSinceLastReward) / (365 days * 10000);
        depositInfo.rewardAmount += rewardAmount;
        depositInfo.lastTimeRewardCalculated = block.timestamp;
    }
}
