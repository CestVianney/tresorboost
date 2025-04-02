// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FarmManager is Ownable {
    event FarmAdded(address indexed farmAddress);
    event FarmUpdated(
        address indexed farmAddress,
        address indexed depositToken,
        bool isActive,
        uint8 farmType
    );

    struct FarmInfo {
        bool isActive;
        uint16 rewardRate;
        uint8 farmType;
        address farmAddress;
        address depositToken;
        address rewardToken;
        bytes4 depositSelector;
        bytes4 withdrawSelector;
        bytes4 claimSelector;
        bytes4 maxWithdrawSelector;
        bool hasClaimSelector;
    }

    mapping(address => FarmInfo) internal farms;

    constructor() Ownable(msg.sender) {}

    function addFarm(
        bool _isActive,
        uint16 _rewardRate,
        uint8 _farmType,
        address _farmAddress,
        address _depositToken,
        address _rewardToken,
        string memory _depositFunction,
        string memory _withdrawFunction,
        string memory _claimFunction,
        string memory _maxWithdrawFunction,
        bool _hasClaimSelector
    ) public onlyOwner {
        farms[_farmAddress] = FarmInfo({
            isActive: _isActive,
            rewardRate: _rewardRate,
            farmType: _farmType,
            farmAddress: _farmAddress,
            depositToken: _depositToken,
            rewardToken: _rewardToken,
            depositSelector: bytes4(keccak256(bytes(_depositFunction))),
            withdrawSelector: bytes4(keccak256(bytes(_withdrawFunction))),
            claimSelector: bytes4(keccak256(bytes(_claimFunction))),
            hasClaimSelector: _hasClaimSelector,
            maxWithdrawSelector: bytes4(keccak256(bytes(_maxWithdrawFunction)))
        });

        emit FarmAdded(_farmAddress);
    }

    function getFarmInfo(
        address _farmAddress
    ) public view returns (FarmInfo memory) {
        return farms[_farmAddress];
    }

    function setFarmInfo(
        address _farmAddress,
        FarmInfo memory _farmInfo
    ) public onlyOwner {
        farms[_farmAddress] = _farmInfo;
        emit FarmUpdated(
            _farmAddress,
            _farmInfo.depositToken,
            _farmInfo.isActive,
            _farmInfo.farmType
        );
    }
}
