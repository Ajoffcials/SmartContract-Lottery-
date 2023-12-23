const { network } = require("hardhat")
const { networkConfig } = require("./../helper-hardhat-config")
const chainId = network.config.chainId
module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    if (chainId == 31337) {
        log("local network detected deploying mocks...")
        const BASEFEE = networkConfig[chainId]["BASEFEE"]
        const GASPRICELINK = networkConfig[chainId]["GASPRICELINK"]
        const VRFCoordinator = await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: [BASEFEE, GASPRICELINK],
            log: true
        })
        log("mocks  deployed...................")
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    }
}

module.exports.tags = ["all", "mocks"]