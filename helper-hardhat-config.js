const { ethers } = require("hardhat")

const networkConfig = {
    11155111: {
        name: "sepolia",
        VRFCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        KeyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "2500000",
        entranceFee: ethers.parseEther("0.01"),
        interval: "30",
        subscriptionId: "5790"
    },
    31337: {
        name: "hardhat",
        BASEFEE: "100000000000000000",
        GASPRICELINK: 1000000000,
        entranceFee: ethers.parseEther("0.01"),
        KeyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "30000000",
        interval: "30",

    },
}
module.exports = {
    networkConfig
}