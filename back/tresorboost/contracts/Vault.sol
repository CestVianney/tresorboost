// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vault {
    IERC20 public immutable token;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public cumulatedRewards;
    uint256 public APR;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _token, uint16 _apr) {
        token = IERC20(_token);
        APR = _apr;
    }

    function deposit(uint256 amount, address user) external {
        require(amount > 0, "Amount must be greater than 0");
        
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        balances[user] += amount;
        lastUpdateTime[user] = block.timestamp;

        emit Deposited(user, amount);
    }

    function withdraw(uint256 amount, address user) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[user] >= amount, "Insufficient balance");

        uint256 rewards = _distributeRewards(user);
        uint256 totalAmount = amount + rewards;
        balances[user] -= totalAmount;
        lastUpdateTime[user] = block.timestamp;

        require(token.transfer(msg.sender, totalAmount), "Transfer failed");

        emit Withdrawn(user, totalAmount);
    }

    function _distributeRewards(address user) internal returns (uint256) {
        uint256 rewards = _calculateRewards(user);
        if (rewards > 0) {
            balances[user] += rewards;
            lastUpdateTime[user] = block.timestamp;
        }
        return rewards;
    }

    function _calculateRewards(address user) internal view returns (uint256) {
        if (balances[user] == 0 || lastUpdateTime[user] == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - lastUpdateTime[user];
        uint256 rewards = (balances[user] * APR * timeElapsed) /
            (365 days * 10000);

        return rewards;
    }

    function getRewards(address user) external view returns (uint256) {
        return _calculateRewards(user);
    }
}
