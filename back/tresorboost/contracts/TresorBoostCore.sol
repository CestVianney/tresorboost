// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FarmManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";

/// @title TresorBoostCore
/// @author CestVianney
/// @notice This contract is the core of the TresorBoost protocol, paired with FarmManager contract
contract TresorBoostCore is Ownable {

    /// @notice Struct to store the deposit information from a specific user to a specific pool
    struct DepositInfo {
        address pool;
        uint256 amount;
        uint256 rewardAmount;
        uint256 lastTimeRewardCalculated;
    }

    /// @notice Error to handle insufficient balance
    error InsufficientBalance(uint256 required);
    /// @notice Error to handle inactive farm
    error InactiveFarm(address inactiveFarm);
    /// @notice Error to handle insufficient deposited funds
    error InsufficientDepositedFunds(uint256 required, uint256 deposited);
    /// @notice Error to handle deposit too soon
    error DepositTooSoon(uint256 required);

    /// @notice Event to handle deposit
    event Deposit(address indexed user, address indexed pool, uint256 amount);
    /// @notice Event to handle withdraw
    event Withdraw(address indexed user, address indexed pool, uint256 amount);
    /// @notice Event to handle rewards claimed
    event RewardsClaimed(address indexed user, address indexed pool, uint256 amount);
    /// @notice Event to handle fees claimed
    event FeesClaimed(address indexed user, address indexed pool, uint256 amount);
    /// @notice Event to handle covered slippage
    event CoveredSlippage(address indexed user, address indexed pool, uint256 slippage);

    /// @notice Modifier to handle deposit too soon
    /// @dev permits to avoid the protocol to deal with a user abusing the deposit function, which leads in losses with slippage coverages
    /// @param _user The address of the user
    /// @param _pool The address of the pool    
    modifier hasDepositedTooSoon(address _user, address _pool) {
        require(block.timestamp - deposits[_user][_pool].lastTimeRewardCalculated > 60 , DepositTooSoon(60));
        _;
    }

    /// @notice Mapping to store the deposit information from a specific user to a specific pool
    mapping(address => mapping(address => DepositInfo)) public deposits;

    /// @notice FarmManager contract
    FarmManager private farmManager;
    /// @notice Uniswap V2 Router
    IUniswapV2Router02 public immutable router;
    /// @notice Bank account
    address public bankAccount;
    /// @notice EURe token
    address public eureToken;

    /// @notice TresorBoostCore constructor
    /// @param _farmManager The address of the FarmManager contract
    /// @param _bankAccount The address of the bank account
    /// @param _eureToken The address of the EURe token
    /// @param _router The address of the Uniswap V2 Router
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

    /// @notice Deposit function to take EURe from user, swap it to the farm's asset and deposit it to the farm
    /// @param _toContract The address of the contract to deposit to
    /// @param _amount The amount of EURe to deposit
    function depositTo(address _toContract, uint256 _amount) public {
        require(IERC20(eureToken).balanceOf(msg.sender) >= _amount, InsufficientBalance(_amount));
        require(IERC20(eureToken).transferFrom(msg.sender, address(this), _amount));
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_toContract);
        require(farmInfo.isActive, InactiveFarm(_toContract));
        // Approuver le Router pour dépenser les EURe
        require(IERC20(eureToken).approve(address(router), _amount), "Approve failed");

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
        require(IERC20(farmInfo.depositToken).approve(_toContract, receivedAmount), "Approve failed");

        _manageDeposit(farmInfo, receivedAmount, _toContract);
        _updateDepositInfo(msg.sender, _toContract, _amount, 0, false);

        emit Deposit(msg.sender, _toContract, _amount);
        emit CoveredSlippage(msg.sender, _toContract, _amount - receivedAmount);
    }

    /// @notice Withdraw function to withdraw from a specific farm by taking it back, sharing the fees and the rewards
    /// @param _fromContract The address of the contract to withdraw from
    /// @param _amount The amount of tokens to withdraw
    /// @dev permits to avoid the protocol to deal with a user abusing the withdraw function, which leads in losses with slippage coverages
    function withdrawFrom(address _fromContract, uint256 _amount) hasDepositedTooSoon(msg.sender, _fromContract) public {
        _updateRewards(_fromContract);
        DepositInfo memory depositInfo = deposits[msg.sender][_fromContract];
        require(depositInfo.amount >= _amount, InsufficientDepositedFunds(_amount, depositInfo.amount));
        _updateDepositInfo(msg.sender, _fromContract, 0, _amount, true);
        // Dued amount to return to user
        uint256 totalDuedAmount = _amount + depositInfo.rewardAmount;
        FarmManager.FarmInfo memory farmInfo = farmManager.getFarmInfo(_fromContract);
        uint256 realWithdrawAmount = _getRealWithdrawAmount(farmInfo, _amount, _fromContract, depositInfo.amount);

        // User deposits in the farms' asset
        uint256 withdrawnAmount;
        if (farmInfo.isVault4626) {
            console.log("REDEEM FROM VAULT 4626");
            withdrawnAmount = _redeemFromVault4626(farmInfo, realWithdrawAmount, _fromContract);
        } else {
            withdrawnAmount = _withdrawFromSimpleVault(farmInfo, realWithdrawAmount, _fromContract);
        }

        uint256 fees = _manageFees(withdrawnAmount, totalDuedAmount);
        // Swap des tokens reçus en EURe
        require(IERC20(farmInfo.depositToken).approve(address(router), withdrawnAmount), "Approve failed");

        // Préparer le chemin du swap inverse
        address[] memory path = new address[](2);
        path[0] = farmInfo.depositToken;
        path[1] = eureToken;

        // Calculate minimum output amount (with 2% slippage)
        uint256[] memory amounts = router.getAmountsOut(withdrawnAmount - fees, path);
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
        uint256 receivedEure = swapResult[1];
        console.log("RECEIVED EURE", receivedEure /1e18);
         // The amount of EURe received after the swap 
        require(IERC20(eureToken).transfer(msg.sender, totalDuedAmount),"Transfer failed");
        require(IERC20(farmInfo.depositToken).transfer(bankAccount, fees), "Transfer failed");
        emit Withdraw(msg.sender, _fromContract, _amount);
        emit RewardsClaimed(msg.sender, _fromContract, depositInfo.rewardAmount);
        emit FeesClaimed(bankAccount, _fromContract, fees);
        emit CoveredSlippage(msg.sender, _fromContract, totalDuedAmount - receivedEure);
    }

    /// @notice Internal function to manage the deposit to the farm, based on its selector
    /// @param farmInfo The farm info
    /// @param _amount The amount of tokens to deposit
    /// @param _toContract The address of the contract to deposit to
    function _manageDeposit(FarmManager.FarmInfo memory farmInfo, uint256 _amount, address _toContract) private {
        address user = msg.sender;
        console.log("AMOUNT", _amount /1e18);
        console.log("USER", user);
        bytes memory depositData = abi.encodeWithSelector(farmInfo.depositSelector, _amount, user);
        console.log("userAddress", user);
        (bool depositResult, ) = _toContract.call(depositData);
        require(depositResult, "Deposit failed");
    }

    /// @notice Internal function to get the real withdraw amount, based on the max withdraw selector
    /// @param farmInfo The farm info
    /// @param _amount The amount of tokens to withdraw
    /// @param _fromContract The address of the contract to withdraw from
    /// @param _storedAmount The amount of tokens stored in the contract
    /// @dev Here, maxWithdraw is the maximum allowed to be withdrawn. Not about withdrawing everything in the farm.
    function _getRealWithdrawAmount(
        FarmManager.FarmInfo memory farmInfo, uint256 _amount, address _fromContract, uint256 _storedAmount
    ) private returns (uint256) {
        address user = msg.sender;
        bytes memory maxWithdrawSelector = abi.encodeWithSelector(farmInfo.maxWithdrawSelector, user);
        
        (bool maxWithdrawResult, bytes memory returnedMaxWithdrawData) = _fromContract.call(maxWithdrawSelector);
        require(maxWithdrawResult, "Max withdraw failed");
        uint256 maxWithdraw = abi.decode(returnedMaxWithdrawData, (uint256));
        
        // Calculer la proportion de shares à retirer
        uint256 sharesToWithdraw = (maxWithdraw * _amount) / _storedAmount;
        console.log("STORED AMOUNT", _storedAmount /1e18);
        console.log("AMOUNT", _amount /1e18);
        console.log("MAX WITHDRAW", maxWithdraw /1e18);
        console.log("sharesToWithdraw", sharesToWithdraw /1e18);
        
        return sharesToWithdraw;
    }

    /// @notice Internal function to redeem from a vault 4626
    /// @param farmInfo The farm info
    /// @param realWithdrawAmount The amount of tokens to redeem
    /// @param _fromContract The address of the contract to redeem from
    /// @dev Here, deals with specific vaults which are ERC4626 standards
    function _redeemFromVault4626(
        FarmManager.FarmInfo memory farmInfo, uint256 realWithdrawAmount, address _fromContract
    ) private returns (uint256) {
        console.log("realWithdrawAmount", realWithdrawAmount /1e18);
        bytes memory withdrawSelector = abi.encodeWithSelector(farmInfo.withdrawSelector, realWithdrawAmount, msg.sender, address(this));
        //take reward token back from user
        console.log("farmInfo.farmAddress", farmInfo.farmAddress);
        require(IERC20(farmInfo.farmAddress).transferFrom(msg.sender, address(this), realWithdrawAmount), "Transfer failed");
        (bool withdrawResult, bytes memory returnedData) = _fromContract.call(withdrawSelector);
        require(withdrawResult, "Withdraw from vault failed");
        console.log("SORTIE DU CALL CONTRACT");
        //take back the amount received from the vault to the user
        uint256 amountRedeemed = abi.decode(returnedData, (uint256));
        console.log("AMOPUNT REEDEMED", amountRedeemed /1e18);
        require(IERC20(farmInfo.depositToken).transferFrom(msg.sender, address(this),amountRedeemed), "Transfer failed");
        console.log("RECUPERATION DES BIENS");
        return amountRedeemed;
    }

    /// @notice Internal function to withdraw from a simple vault
    /// @param farmInfo The farm info
    /// @param realWithdrawAmount The amount of tokens to withdraw
    /// @param _fromContract The address of the contract to withdraw from
    /// @dev Here, we deal with a custom vault following no standards and having different selectors
    function _withdrawFromSimpleVault(
        FarmManager.FarmInfo memory farmInfo, uint256 realWithdrawAmount, address _fromContract
        ) private returns (uint256) {
        bytes memory withdrawSelector = abi.encodeWithSelector(farmInfo.withdrawSelector, realWithdrawAmount, msg.sender);
        (bool withdrawResult, bytes memory returnedData) = _fromContract.call(withdrawSelector);
        require(withdrawResult, "Withdraw from vault failed");
        return abi.decode(returnedData, (uint256));
    }

    /// @notice Internal function to update the deposit info
    /// @param user The address of the user
    /// @param pool The address of the pool
    /// @param depositAmount The amount of tokens to deposit
    /// @param withdrawAmount The amount of tokens to withdraw
    /// @param hasClaimed Whether the user has claimed the rewards
    function _updateDepositInfo(
        address user, address pool, uint256 depositAmount, uint256 withdrawAmount, bool hasClaimed
        ) private {
        _updateRewards(pool);
        DepositInfo memory depositInfo = deposits[user][pool];
        deposits[user][pool] = DepositInfo({
            pool: pool,
            amount: depositInfo.amount - withdrawAmount + depositAmount, // Convertir en EURe avant le calcul
            rewardAmount: hasClaimed ? 0 : depositInfo.rewardAmount,
            lastTimeRewardCalculated: block.timestamp
        });
    }

    /// @notice Internal function to manage the fees
    /// @param withdrawAmount The amount of tokens to withdraw
    /// @param totalDuedAmount The total amount of tokens due
    /// @return The amount of fees, depending on the withdraw amount and the total due
    function _manageFees(uint256 withdrawAmount, uint256 totalDuedAmount) private pure returns (uint256) {
        return withdrawAmount > totalDuedAmount ?
                withdrawAmount - totalDuedAmount :
                0;
    }

    /// @notice Internal function to update the rewards
    /// @param _pool The address of the pool
    function _updateRewards(address _pool) private {
        DepositInfo memory depositInfo = deposits[msg.sender][_pool];
        if (depositInfo.lastTimeRewardCalculated == 0) {
            return;
        }
        uint256 timeSinceLastReward = block.timestamp -
            depositInfo.lastTimeRewardCalculated;
        uint256 rewardAmount = (
            depositInfo.amount * farmManager.getFarmInfo(_pool).rewardRate * timeSinceLastReward
            ) / (365 days * 10000);
        deposits[msg.sender][_pool].rewardAmount += rewardAmount;
    }
}
