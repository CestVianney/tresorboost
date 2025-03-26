// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FarmManager is Ownable {
    struct FarmInfo {
        address farmAddress;
        address depositToken;
        address rewardToken;
        bytes4 depositSelector;
        bytes4 withdrawSelector;
        bytes4 claimSelector;
        uint16 rewardRate;
        bool isActive;
    }

    mapping(address => FarmInfo) internal farms;

    constructor() Ownable(msg.sender) {}

    function addFarm(
        bool _isActive,
        uint16 _rewardRate,
        address _farmAddress,
        address _depositToken,
        address _rewardToken,
        string memory _depositFunction,
        string memory _withdrawFunction,
        string memory _claimFunction        
    ) public onlyOwner {
        farms[_farmAddress] = FarmInfo({
            isActive: _isActive,
            farmAddress: _farmAddress,
            depositToken: _depositToken,
            rewardToken: _rewardToken,
            rewardRate: _rewardRate,
            depositSelector: bytes4(keccak256(bytes(_depositFunction))),
            withdrawSelector: bytes4(keccak256(bytes(_withdrawFunction))),
            claimSelector: bytes4(keccak256(bytes(_claimFunction)))
            });
    }

    function getFarmInfo(address _farmAddress) public view returns (FarmInfo memory) {
        return farms[_farmAddress];
    }

    function setFarmInfo(address _farmAddress, FarmInfo memory _farmInfo) public onlyOwner {
        farms[_farmAddress] = _farmInfo;
    }
}
