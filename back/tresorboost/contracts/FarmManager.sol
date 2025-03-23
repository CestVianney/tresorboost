// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FarmManager is Ownable {
    struct FarmInfo {
        address farmAddress;
        address depositTokenA;
        address depositTokenB;
        address rewardToken;
        bytes4 depositSelector;
        bytes4 withdrawSelector;
        bytes4 claimSelector;
    }

    mapping(address => FarmInfo) internal farms;

    constructor() Ownable(msg.sender) {}

    function addFarm(
        address _farmAddress,
        address _depositTokenA,
        address _depositTokenB,
        address _rewardToken,
        string memory _depositFunction,
        string memory _withdrawFunction,
        string memory _claimFunction
    ) public onlyOwner {
        farms[_farmAddress] = FarmInfo({
            farmAddress: _farmAddress,
            depositTokenA: _depositTokenA,
            depositTokenB: _depositTokenB,
            rewardToken: _rewardToken,
            depositSelector: bytes4(keccak256(bytes(_depositFunction))),
            withdrawSelector: bytes4(keccak256(bytes(_withdrawFunction))),
            claimSelector: bytes4(keccak256(bytes(_claimFunction)))
        });
    }

    function getFarmInfo(address _farmAddress) public view returns (FarmInfo memory) {
        return farms[_farmAddress];
    }

}
