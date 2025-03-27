// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FarmManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

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
    IUniswapV2Router02 public immutable router;
    address public bankAccount;
    address public eureToken;

    constructor(
        address _farmManager, 
        address _bankAccount, 
        address _eureToken,
        address _router
    ) Ownable(msg.sender) {
        farmManager = FarmManager(_farmManager);
        bankAccount = _bankAccount;
        eureToken = _eureToken;
        router = IUniswapV2Router02(_router);
    }

    function depositTo(address _toContract, uint256 _amount) public {
        require(IERC20(eureToken).balanceOf(msg.sender) >= _amount);
        require(IERC20(eureToken).transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        require(farmManager.getFarmInfo(_toContract).isActive, "Farm is not active");
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_toContract);

        // Approuver le Router pour dépenser les EURe
        require(IERC20(eureToken).approve(address(router), _amount), "Approve failed");

        // Préparer le chemin du swap
        address[] memory path = new address[](2);
        path[0] = eureToken;
        path[1] = farmInfo.depositToken;

        // Calculer le montant minimum de sortie (avec 5% de slippage)
        uint256[] memory amounts = router.getAmountsOut(_amount, path);
        uint256 amountOutMin = (amounts[1] * 95) / 100;

        // Effectuer le swap
        router.swapExactTokensForTokens(
            _amount,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300 // 5 minutes de deadline
        );

        // Approuver le contrat de farm pour dépenser les tokens reçus
        uint256 receivedAmount = IERC20(farmInfo.depositToken).balanceOf(address(this));
        require(IERC20(farmInfo.depositToken).approve(_toContract, receivedAmount), "Approve failed");

        // Faire le dépôt dans le farm
        bytes memory depositData = abi.encodeWithSelector(farmInfo.depositSelector, receivedAmount);
        (bool depositResult,) = _toContract.call(depositData);
        require(depositResult, "Deposit failed");

        _updateDepositInfo(msg.sender, _toContract, _amount, 0);

        emit Deposit(msg.sender, _toContract, _amount);
    }

    function withdrawFrom(address _fromContract, uint256 _amount) public {
        updateRewards(_fromContract);
        DepositInfo memory depositInfo = deposits[msg.sender][_fromContract];

        require(depositInfo.amount >= _amount, "Insufficient balance");
        uint256 totalDuedAmount = _amount + depositInfo.rewardAmount;

        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_fromContract);
        
        // Retirer du farm
        bytes memory withdrawData = abi.encodeWithSelector(farmInfo.withdrawSelector, _amount);
        (bool withdrawResult, bytes memory returnedWithdrawData) = _fromContract.call(withdrawData);
        require(withdrawResult, "Withdraw failed");
        uint256 withdrawAmount = abi.decode(returnedWithdrawData, (uint256));

        // Claim des récompenses si nécessaire
        uint256 fees = _handleRewards(_fromContract, farmInfo, withdrawAmount, totalDuedAmount);

        // Swap des tokens reçus en EURe
        uint256 receivedAmount = IERC20(farmInfo.depositToken).balanceOf(address(this));
        require(IERC20(farmInfo.depositToken).approve(address(router), receivedAmount), "Approve failed");

        // Préparer le chemin du swap inverse
        address[] memory path = new address[](2);
        path[0] = farmInfo.depositToken;
        path[1] = eureToken;

        // Calculer le montant minimum de sortie (avec 5% de slippage)
        uint256[] memory amounts = router.getAmountsOut(receivedAmount, path);
        uint256 amountOutMin = (amounts[1] * 95) / 100;

        // Effectuer le swap
        router.swapExactTokensForTokens(
            receivedAmount,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300 // 5 minutes de deadline
        );

        _updateDepositInfo(msg.sender, _fromContract, 0, _amount);

        // Transférer les EURe à l'utilisateur et les frais au compte bancaire
        require(IERC20(eureToken).transfer(msg.sender, totalDuedAmount), "Transfer failed");
        require(IERC20(eureToken).transfer(bankAccount, fees), "Transfer failed");

        emit Withdraw(msg.sender, _fromContract, _amount);
    }

    function _updateDepositInfo(address user, address pool, uint256 depositAmount, uint256 withdrawAmount) private {
        DepositInfo memory depositInfo = deposits[user][pool];
        deposits[user][pool] = DepositInfo({
            pool: pool,
            amount: depositInfo.amount + depositAmount - withdrawAmount,
            rewardAmount: depositInfo.rewardAmount,
            lastTimeRewardCalculated: block.timestamp
        });
    }

    function _handleRewards(
        address _fromContract,
        FarmManager.FarmInfo memory farmInfo,
        uint256 withdrawAmount,
        uint256 totalDuedAmount
    ) private returns (uint256) {
        if(farmInfo.claimSelector != bytes4(0)) {
            bytes memory claimData = abi.encodeWithSelector(farmInfo.claimSelector);
            (bool claimResult, bytes memory returnedClaimData) = _fromContract.call(claimData);
            require(claimResult, "Claim failed");
            uint256 claimedAmount = abi.decode(returnedClaimData, (uint256));
            return claimedAmount - deposits[msg.sender][_fromContract].rewardAmount;
        } else {
            return withdrawAmount - totalDuedAmount;
        }
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
