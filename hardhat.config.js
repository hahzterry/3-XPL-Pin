require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '.env.local' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    plasma: {
      url: "https://rpc.plasma.to",
      chainId: 9745,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    plasmaTestnet: {
      url: "https://testnet-rpc.plasma.to",
      chainId: 9746,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      plasma: "plasma", // apiKey is not required, just set a placeholder
    },
    customChains: [
      {
        network: "plasma",
        chainId: 9745,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/mainnet/evm/9745/etherscan",
          browserURL: "https://plasmaexplorer.io"
        }
      }
    ]
  }
};
