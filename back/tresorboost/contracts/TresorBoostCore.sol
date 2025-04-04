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

    error InsufficientBalance(uint256 required);
    error InactiveFarm(address inactiveFarm);
    error InsufficientDepositedFunds(uint256 required, uint256 deposited);

    event Deposit(address indexed user, address indexed pool, uint256 amount);
    event Withdraw(address indexed user, address indexed pool, uint256 amount);
    event RewardsClaimed(
        address indexed user,
        address indexed pool,
        uint256 amount
    );
    event FeesClaimed(
        address indexed user,
        address indexed pool,
        uint256 amount
    );
    event CoveredSlippage(
        address indexed user,
        address indexed pool,
        uint256 slippage
    );

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
        require(
            IERC20(eureToken).balanceOf(msg.sender) >= _amount,
            InsufficientBalance(_amount)
        );
        require(
            IERC20(eureToken).transferFrom(msg.sender, address(this), _amount)
        );
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(
            _toContract
        );
        require(farmInfo.isActive, InactiveFarm(_toContract));

        // Approuver le Router pour dépenser les EURe
        require(
            IERC20(eureToken).approve(address(router), _amount),
            "Approve failed"
        );

        // Préparer le chemin du swap
        address[] memory path = new address[](2);
        path[0] = eureToken;
        path[1] = farmInfo.depositToken;

        // Calculer le montant minimum de sortie (avec 5% de slippage)
        uint256[] memory amounts = router.getAmountsOut(_amount, path);
        uint256 amountOutMin = (amounts[1] * 98) / 100;

        // Effectuer le swap
        uint256[] memory swapResult = router.swapExactTokensForTokens(
            _amount,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300
        );

        // Utiliser le montant retourné par le swap au lieu du solde total
        uint256 receivedAmount = swapResult[1]; // Le montant de tokens reçus après le swap
        require(
            IERC20(farmInfo.depositToken).approve(_toContract, receivedAmount),
            "Approve failed"
        );

        _manageDeposit(farmInfo, receivedAmount, _toContract);

        _updateDepositInfo(msg.sender, _toContract, _amount, 0, false);

        emit Deposit(msg.sender, _toContract, _amount);
        emit CoveredSlippage(msg.sender, _toContract, _amount - receivedAmount);
    }

    function withdrawFrom(address _fromContract, uint256 _amount) public {
        _updateRewards(_fromContract);
        DepositInfo memory depositInfo = deposits[msg.sender][_fromContract];

        require(
            depositInfo.amount >= _amount,
            InsufficientDepositedFunds(_amount, depositInfo.amount)
        );
        // Dued amount to return to user
        uint256 totalDuedAmount = _amount + depositInfo.rewardAmount;
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(
            _fromContract
        );
        uint256 realWithdrawAmount = getRealWithdrawAmount(
            farmInfo,
            _amount,
            _fromContract,
            depositInfo.amount
        );

        // User deposits in the farms' asset
        uint256 withdrawnAmount;
        if (farmInfo.isVault4626) {
            withdrawnAmount = _redeemFromVault4626(
                farmInfo,
                realWithdrawAmount,
                _fromContract
            );
        } else {
            withdrawnAmount = _withdrawFromSimpleVault(
                farmInfo,
                realWithdrawAmount,
                _fromContract
            );
        }

        uint256 fees = _manageFees(withdrawnAmount, totalDuedAmount);
        // Swap des tokens reçus en EURe
        require(
            IERC20(farmInfo.depositToken).approve(
                address(router),
                withdrawnAmount
            ),
            "Approve failed"
        );

        // Préparer le chemin du swap inverse
        address[] memory path = new address[](2);
        path[0] = farmInfo.depositToken;
        path[1] = eureToken;

        // Calculate minimum output amount (with 2% slippage)
        uint256[] memory amounts = router.getAmountsOut(
            withdrawnAmount - fees,
            path
        );
        uint256 amountOutMin = (amounts[1] * 98) / 100;

        // Perform the swap
        uint256[] memory swapResult = router.swapExactTokensForTokens(
            withdrawnAmount - fees,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300
        );

        // Use the amount returned by the swap
        uint256 receivedEure = swapResult[1]; // The amount of EURe received after the swap

        _updateDepositInfo(msg.sender, _fromContract, 0, _amount, true);

        require(
            IERC20(eureToken).transfer(msg.sender, totalDuedAmount),
            "Transfer failed"
        );
        require(
            IERC20(farmInfo.depositToken).transfer(bankAccount, fees),
            "Transfer failed"
        );

        emit Withdraw(msg.sender, _fromContract, _amount);
        emit RewardsClaimed(
            msg.sender,
            _fromContract,
            depositInfo.rewardAmount
        );
        emit FeesClaimed(bankAccount, _fromContract, fees);
        emit CoveredSlippage(
            msg.sender,
            _fromContract,
            totalDuedAmount - receivedEure
        );
    }

    function _manageDeposit(
        FarmManager.FarmInfo memory farmInfo,
        uint256 _amount,
        address _toContract
    ) private {
        bytes memory depositData = abi.encodeWithSelector(
            farmInfo.depositSelector,
            _amount,
            msg.sender
        );
        (bool depositResult, ) = _toContract.call(depositData);
        require(depositResult, "Deposit failed");
    }

    function getRealWithdrawAmount(
        FarmManager.FarmInfo memory farmInfo,
        uint256 _amount,
        address _fromContract,
        uint256 _storedAmount
    ) private returns (uint256) {
        bytes memory maxWithdrawSelector = abi.encodeWithSelector(farmInfo.maxWithdrawSelector, msg.sender);
        (bool maxWithdrawResult, bytes memory returnedMaxWithdrawData) = _fromContract.call(maxWithdrawSelector);
        require(maxWithdrawResult, "Max withdraw failed");
        uint256 maxWithdraw = abi.decode(returnedMaxWithdrawData, (uint256));
        uint256 rate = (_amount * 10000) / _storedAmount;

        return (maxWithdraw * rate) / 10000;
    }

    function _redeemFromVault4626(
        FarmManager.FarmInfo memory farmInfo,
        uint256 realWithdrawAmount,
        address _fromContract
    ) private returns (uint256) {
        bytes memory withdrawSelector = abi.encodeWithSelector(farmInfo.withdrawSelector, realWithdrawAmount, msg.sender, this);
        //take reward token back from user
        require(IERC20(farmInfo.farmAddress).transferFrom(msg.sender, address(this), realWithdrawAmount), "Transfer failed");
        (bool withdrawResult, bytes memory returnedData) = _fromContract.call(withdrawSelector);
        require(withdrawResult, "Withdraw from vault failed");
        return abi.decode(returnedData, (uint256));
    }

    function _withdrawFromSimpleVault(FarmManager.FarmInfo memory farmInfo, uint256 realWithdrawAmount, address _fromContract ) private returns (uint256) {
        bytes memory withdrawSelector = abi.encodeWithSelector(farmInfo.withdrawSelector, realWithdrawAmount, msg.sender);
        (bool withdrawResult, bytes memory returnedData) = _fromContract.call(withdrawSelector);
        require(withdrawResult, "Withdraw from vault failed");
        return abi.decode(returnedData, (uint256));
    }

    function _updateDepositInfo(address user, address pool, uint256 depositAmount, uint256 withdrawAmount, bool hasClaimed) private {
        _updateRewards(pool);
        DepositInfo memory depositInfo = deposits[user][pool];
        deposits[user][pool] = DepositInfo({
            pool: pool,
            amount: depositInfo.amount - withdrawAmount + depositAmount, // Convertir en EURe avant le calcul
            rewardAmount: hasClaimed ? 0 : depositInfo.rewardAmount,
            lastTimeRewardCalculated: block.timestamp
        });
    }

    function _manageFees(uint256 withdrawAmount, uint256 totalDuedAmount) private pure returns (uint256) {
        return withdrawAmount > totalDuedAmount ?
                withdrawAmount - totalDuedAmount :
                0;
    }

    function _updateRewards(address _pool) private {
        DepositInfo memory depositInfo = deposits[msg.sender][_pool];
        if (depositInfo.lastTimeRewardCalculated == 0) {
            return;
        }
        uint256 timeSinceLastReward = block.timestamp -
            depositInfo.lastTimeRewardCalculated;
        uint256 rewardAmount = (depositInfo.amount *
            farmManager.getFarmInfo(_pool).rewardRate *
            timeSinceLastReward) / (365 days * 10000);
        deposits[msg.sender][_pool].rewardAmount += rewardAmount;
    }
}
