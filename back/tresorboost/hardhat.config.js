require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: process.env.ETH_RPC_URL,
        blockNumber: 21423360,
      },
      initialBaseFeePerGas: 1000000000, // 1 gwei
      gasPrice: 10000000000, // 10 gwei
    },
    localhost: {
      forking: {
        enabled: true,
        url: process.env.ETH_RPC_URL,
      },
      blockNumber: 21423360,
      gasPrice: 100000000000
    }
  }
};
