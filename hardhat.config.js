require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-gas-reporter");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
const PRIVATEKEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const ETHERSCAN_APIKEY = process.env.ETHERSCAN_APIKEY;
const coinmarketApiKey = process.env.COINMARKET_APIKEY;
module.exports = {
  // defaultNetwork: "hardhat",
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: RPC_URL,
      accounts: [PRIVATEKEY],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_APIKEY,
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: coinmarketApiKey,
    token: "ETH",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 10000000,
  },
};
