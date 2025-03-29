require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-tracer");

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
    localhost: {
      forking: {
        enabled: true,
        url: process.env.ETH_RPC_URL,
        chainId: 11155111,
      },
      blockNumber: 8006851,
      gasPrice: 100000000000
    }
  }
};
