// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Vault is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    uint256 public constant YIELD_RATE = 100; // 1% par jour en base 10000
    uint256 public lastUpdate;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        asset = _asset;
        lastUpdate = block.timestamp;
    }

    // Simule l'accumulation de rendement depuis le dernier update
    function accumulatedYield() public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastUpdate;
        uint256 daysElapsed = timeElapsed / 1 days;
        if (daysElapsed == 0) return 0;
        
        uint256 currentBalance = asset.balanceOf(address(this));
        uint256 yield = 0;
        
        // Calcul du rendement composé quotidien
        for (uint i = 0; i < daysElapsed; i++) {
            yield += (currentBalance * YIELD_RATE) / 10000;
            currentBalance += yield;
        }
        
        return yield;
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        require(assets > 0, "Cannot deposit 0 assets");
        require(receiver != address(0), "Invalid receiver");

        // Calcul des parts
        shares = totalSupply() == 0 
            ? assets 
            : (assets * totalSupply()) / asset.balanceOf(address(this));

        // Transfert des tokens
        asset.safeTransferFrom(msg.sender, address(this), assets);
        _mint(receiver, shares);

        emit Deposit(receiver, assets);
    }

    function withdraw(uint256 assets, address receiver) external returns (uint256 shares) {
        require(assets > 0, "Cannot withdraw 0 assets");
        require(receiver != address(0), "Invalid receiver");

        // Mock du rendement accumulé
        uint256 yield = accumulatedYield();
        if (yield > 0) {
            // Dans un vrai contrat, on devrait mint ces tokens
            // Ici on simule juste le rendement
            lastUpdate = block.timestamp;
        }

        // Calcul des parts à brûler
        shares = (assets * totalSupply()) / asset.balanceOf(address(this));
        require(balanceOf(msg.sender) >= shares, "Insufficient balance");

        // Transfert des tokens
        _burn(msg.sender, shares);
        asset.safeTransfer(receiver, assets);

        emit Withdraw(receiver, assets);
    }

    // Fonction de vue pour simuler la valeur actuelle des actifs
    function previewTotalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this)) + accumulatedYield();
    }
}
