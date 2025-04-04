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
        bytes4 depositSelector;
        bytes4 withdrawSelector;
        bytes4 maxWithdrawSelector;
        bool isVault4626;
    }

    mapping(address => FarmInfo) internal farms;

    constructor() Ownable(msg.sender) {}

    function addFarm(
        bool _isActive,
        uint16 _rewardRate,
        uint8 _farmType,
        address _farmAddress,
        address _depositToken,
        string memory _depositFunction,
        string memory _withdrawFunction,
        string memory _maxWithdrawFunction,
        bool _isVault4626
    ) public onlyOwner {
        farms[_farmAddress] = FarmInfo({
            isActive: _isActive,
            rewardRate: _rewardRate,
            farmType: _farmType,
            farmAddress: _farmAddress,
            depositToken: _depositToken,
            depositSelector: bytes4(keccak256(bytes(_depositFunction))),
            withdrawSelector: bytes4(keccak256(bytes(_withdrawFunction))),
            maxWithdrawSelector: bytes4(keccak256(bytes(_maxWithdrawFunction))),
            isVault4626: _isVault4626
        });

        emit FarmAdded(_farmAddress);
    }

    function getFarmInfo(
        address _farmAddress
    ) public view returns (FarmInfo memory) {
        return farms[_farmAddress];
    }
}
