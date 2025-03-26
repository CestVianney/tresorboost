require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000}
      },
    compilers: [
      {
        version: "0.8.28", 
      },
      {
        version: "0.5.16" // for Uniswap v2 contracts
      },
      {
        version: "0.6.6", // for Uniswap v2 contracts,
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000
          }
        }
      },
      {
        version: "0.4.18" // for WETH
      }
    ]
  },
  allowUnlimitedContractSize: true,
};
