require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: process.env.ETH_RPC_URL,
        blockNumber: 21423360
      }
    }
  }
};
