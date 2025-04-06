// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FarmManager contract
/// @notice Contract to manage the farms
/// @dev This contract is used to manage the farms and the farms' info. Linked with TresorBoostCore contract
contract FarmManager is Ownable {
    /// @notice Event to handle the addition of a farm
    /// @param farmAddress The address of the farm
    event FarmAdded(address indexed farmAddress);

    /// @notice Struct to handle the farm info
    /// @param isActive Whether the farm is active
    /// @param rewardRate The reward rate of the farm
    /// @param farmType The type of the farm
    /// @param farmAddress The address of the farm
    /// @param depositToken The address of the deposit token
    /// @param depositSelector The selector of the deposit function
    /// @param withdrawSelector The selector of the withdraw function
    /// @param maxWithdrawSelector The selector of the max withdraw function
    /// @param isVault4626 Whether the farm is a vault 4626
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

    // @title A title that should describe the contract/interface
    // @author The name of the author
    // @notice Explain to an end user what this does
    // @dev Explain to a developer any extra details
    mapping(address => FarmInfo) internal farms;

    /// @notice Constructor of the FarmManager contract
    /// @dev Initializes the contract with the owner of the contract
    constructor() Ownable(msg.sender) {}

    /// @notice Function to add a farm
    /// @param _isActive Whether the farm is active
    /// @param _rewardRate The reward rate of the farm
    /// @param _farmType The type of the farm
    /// @param _farmAddress The address of the farm
    /// @param _depositToken The address of the deposit token
    /// @param _depositFunction The selector of the deposit function
    /// @param _withdrawFunction The selector of the withdraw function
    /// @param _maxWithdrawFunction The selector of the max withdraw function
    /// @param _isVault4626 Whether the farm is a vault 4626
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

    /// @notice Function to get the farm info
    /// @param _farmAddress The address of the farm
    /// @return The farm info
    function getFarmInfo(
        address _farmAddress
    ) public view returns (FarmInfo memory) {
        return farms[_farmAddress];
    }
}
