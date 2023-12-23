const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect } = require("chai")
const { networkConfig } = require("./../../helper-hardhat-config")
const chainId = network.config.chainId

chainId == 31337
    ? describe.skip
    : describe("Raffle Staging test", () => {
        let deployer, raffle, entranceFee, accounts
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer
            raffle = await ethers.getContract("Raffle", deployer)
            raffle.waitForDeployment()
            entranceFee = networkConfig[chainId]["entranceFee"]
            accounts = await ethers.getSigners()
        })
        describe("fullfuillRandom words", () => {
            it("works with live chainlink keepers and chainlink vrf we get a random winner", async () => {
                const StratingTimeStamp = await raffle.getLatestTimeStamp()
                //set up listener before we enter raffle
                await new Promise(async (resolve, reject) => {
                    raffle.once("winnerPicked", async () => {
                        console.log("Winer Picked Events fired")
                        try {
                            const recentWinner = await raffle.getWinner()
                            const raffleState = await raffle.getRaffleState()
                            //this takes long time to check balance
                            console.log("checking recent winner balance pls wait")
                            // const recentWinnerBalance = await accounts[0].getBalance()
                            const endingTimeStamp = await raffle.getLatestTimeStamp()
                            await expect(raffle.getPlayers(0)).to.be.reverted
                            assert.equal(recentWinner, accounts[0].address)
                            assert.equal(raffleState, 0)
                            assert(endingTimeStamp > StratingTimeStamp)
                        } catch (error) {
                            reject(error)
                        }
                        resolve()
                    })
                    //enter Raffle
                    console.log("entering raffle pls wait")
                    await raffle.enterRaffle({ value: entranceFee })
                })
            })
        })
    })