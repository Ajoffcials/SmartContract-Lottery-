const { network, ethers } = require("hardhat")
const { networkConfig } = require("./../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()
const chainId = network.config.chainId
const fundAmount = ethers.parseEther("30")
module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    let vrfcordinatorAddress, entranceFee, KeyHash, subscriptionId, callbackGasLimit, interval;
    if (chainId == 31337) {
        const VRFCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfcordinatorAddress = await VRFCoordinatorMock.getAddress()
        entranceFee = networkConfig[chainId]["entranceFee"]
        KeyHash = networkConfig[chainId]["KeyHash"]
        const transacationResponse = await VRFCoordinatorMock.createSubscription()
        const trasactionReciept = await transacationResponse.wait(1)
        subscriptionId = "1";
        await VRFCoordinatorMock.fundSubscription(subscriptionId, fundAmount);
        callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
        interval = networkConfig[chainId]["interval"];



    } else {
        vrfcordinatorAddress = networkConfig[chainId]["VRFCoordinator"]
        entranceFee = networkConfig[chainId]["entranceFee"]
        KeyHash = networkConfig[chainId]["KeyHash"]
        callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
        interval = networkConfig[chainId]["interval"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }
    arg = [vrfcordinatorAddress, entranceFee, KeyHash, subscriptionId, callbackGasLimit, interval]
    log("deploying raffle pls wait.....................")
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: arg,
        log: true
    })

    if (chainId != 31337 && process.env.ETHERSCAN_APIKEY) {
        log("verifying...................................")
        await verify(await raffle.address, arg)
    }
}
module.exports.tags = ["all", "raffle"]