// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ClaimableVault {
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

    function deposit(uint256 _amount, address _user) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        _updateRewards(_user);
        balances[_user] += _amount;
        lastUpdateTime[_user] = block.timestamp;

        emit Deposited(_user, _amount);
    }

    function deposit(uint256 _amount, address _user, uint256 _random ) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        require(_random > 0, "Random must be greater than 0");
        _updateRewards(_user);
        balances[_user] += _amount;
        lastUpdateTime[_user] = block.timestamp;

        emit Deposited(_user, _amount);
    }

    function withdraw(uint256 _amount, address _user) external returns (uint256) {
        require(_amount > 0, "Amount must be greater than 0");
        require(balances[_user] >= _amount, "Insufficient balance");
        
        _updateRewards(_user);

        balances[_user] -= _amount;
        lastUpdateTime[_user] = block.timestamp;
        require(token.transfer(msg.sender, _amount), "Transfer failed");
        emit Withdrawn(_user, _amount);
        return _amount;
    }

    function claimRewards(address _user) external {
        require(msg.sender == _user, "Only the user can claim their rewards");
        uint256 rewards = _updateRewards(_user);
        cumulatedRewards[_user] = 0;
        require(token.transfer(_user, rewards), "Transfer failed");
        emit RewardsClaimed(_user, rewards);
    }

    function _updateRewards(address user) internal returns (uint256) {
        uint256 rewards = _calculateRewards(user);
        if (rewards > 0) {
            cumulatedRewards[user] += rewards;
            lastUpdateTime[user] = block.timestamp;
        }
        return cumulatedRewards[user];
    }

    function _calculateRewards(address user) internal view returns (uint256) {
        if (balances[user] == 0 || lastUpdateTime[user] == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - lastUpdateTime[user];
        uint256 rewards = (balances[user] * APR * timeElapsed) / (365 days * 10000);
        return rewards;
    }

    function getRewards(address user) external view returns (uint256) {
        return _calculateRewards(user);
    }

    function getMaxWithdraw(address user) external view returns (uint256) {
        return balances[user];
    }
}
