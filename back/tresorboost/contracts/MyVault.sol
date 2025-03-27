// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MyVault {
    IERC20 public immutable token;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public cumulatedRewards;
    uint256 public constant APR = 500;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _token) {
        token = IERC20(_token);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        balances[msg.sender] += amount;
        lastUpdateTime[msg.sender] = block.timestamp;

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        uint256 rewards = _distributeRewards(msg.sender);
        uint256 totalAmount = amount + rewards;
        balances[msg.sender] -= totalAmount;
        lastUpdateTime[msg.sender] = block.timestamp;

        require(token.transfer(msg.sender, totalAmount), "Transfer failed");

        emit Withdrawn(msg.sender, totalAmount);
    }

    function claimRewards() external {
        uint256 rewards = _calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");

        balances[msg.sender] += rewards;
        lastUpdateTime[msg.sender] = block.timestamp;

        emit RewardsClaimed(msg.sender, rewards);
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
