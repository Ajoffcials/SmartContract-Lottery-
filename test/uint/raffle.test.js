const { networkConfig } = require("./../../helper-hardhat-config")
const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const chainId = network.config.chainId
const { assert, expect } = require("chai")
chainId !== 31337
    ? describe.skip
    : describe("raffle", () => {
        let mockV3Aggregator, raffleContract, raffleEntranceFee, deployer, interval, subscriptionId
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            raffleContract = await ethers.getContract("Raffle", deployer)
            mockV3Aggregator = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await mockV3Aggregator.waitForDeployment()
            await raffleContract.waitForDeployment()
            raffleEntranceFee = await raffleContract.getEntranceFee()
            interval = await raffleContract.getInterval()
            subscriptionId = await raffleContract.getSubscriptionId()
            await mockV3Aggregator.addConsumer(subscriptionId, await raffleContract.getAddress());
        })
        describe("constructor", () => {
            it("confirms cordinator address", async () => {
                const mockV3AggregatorAddress = await mockV3Aggregator.getAddress()
                const response = await raffleContract.getCordinator()
                assert.equal(mockV3AggregatorAddress, response)
            })
            it("confirms entranceFee", async () => {
                const response = await raffleContract.getEntranceFee()
                const EntranceFeeConfirm = networkConfig[chainId]["entranceFee"]
                assert.equal(response, EntranceFeeConfirm)
            })
            it("instalixe raffle state correctly", async () => {
                const RaffleState = await raffleContract.getRaffleState()
                const interval = await raffleContract.getInterval()
                assert.equal(RaffleState, 0)
                assert.equal(interval, networkConfig[chainId]["interval"])
            })
        })
        describe("enterRaffle", async () => {
            it("revets when you dont pay enouth eth", async () => {
                await expect(raffleContract.enterRaffle()).to.be.revertedWithCustomError(raffleContract, "Raffle__NotEnoughEth()")
            })


            it("record players when they enter", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                const playersFromContract = await raffleContract.getPlayers(0)
                assert.equal(playersFromContract, deployer)
            })

            it("emits an events", async () => {
                await expect(raffleContract.enterRaffle({ value: raffleEntranceFee })).to.emit(raffleContract, "RaffleEnter")
            })
            it("dosent allow entrance ehen raffle is calculating", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await time.increase(Number(interval) + 1)
                await raffleContract.performUpkeep("0x")
                await expect(raffleContract.enterRaffle({ value: raffleEntranceFee })).to.revertedWithCustomError(raffleContract, "Raffle__NotOpen()"
                )
            })
        })
        describe("checkUpKeep", () => {
            it("returns false if people havent sent any eth", async () => {
                await time.increase(Number(interval) + 1)
                const { upKeepNeeded } = await raffleContract.checkUpkeep.staticCall("0x");
                assert(!upKeepNeeded)
            })
            it("returns false if raffle is not open", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await time.increase(Number(interval) + 1)
                await raffleContract.performUpkeep("0x")
                const raffleStae = await raffleContract.getRaffleState()
                const { upKeepNeeded } = await raffleContract.checkUpkeep.staticCall("0x");
                assert.equal(raffleStae, 1)
                assert(!upKeepNeeded)

            })
            it("returns false if time hasnt passed", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee });
                await time.increase(Number(interval) - 10)
                const { upkeepNeeded } = await raffleContract.checkUpkeep.staticCall("0x");
                assert(!upkeepNeeded)

            });
            it("returns true if enough time has passed, eth, and it is open", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee });
                await time.increase(Number(interval) + 1);
                const { upkeepNeeded } = await raffleContract.checkUpkeep.staticCall("0x");
                assert(upkeepNeeded);
            });
        })
        describe("perform upKeep", () => {
            it("can only run if checkUp is true", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await time.increase(Number(interval) + 1)
                const tx = await raffleContract.performUpkeep("0x")
                assert(tx)
            })
            it("reverts when checkUpkeep is false", async () => {
                await expect(raffleContract.performUpkeep("0x")).to.be.revertedWithCustomError(raffleContract, "Raffle__upKeepNotNeeded")
            })
            it("updates the raffle state emits an events and call the vrfcordinator", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await time.increase(Number(interval) + 1)
                const tx = await raffleContract.performUpkeep("0x")
                const txReceipt = await tx.wait(1)
                const requestId = await txReceipt.logs[1].args



                const raffleState = await raffleContract.getRaffleState()
                assert(requestId > 0)
                assert.equal(raffleState, 1)
                //rember the answer is in array this is the randow number requested
                console.log(requestId)

            })

            describe("fullfuill random words", () => {
                beforeEach(async () => {
                    await raffleContract.enterRaffle({ value: raffleEntranceFee })
                    await time.increase(Number(interval) + 1)
                })
                it("it can only be called after performUpkeep", async () => {
                    await expect(mockV3Aggregator.fulfillRandomWords(0, await raffleContract.getAddress())).to.be.reverted
                })
                it("picks a winner,  test the lottery and send Money, ", async () => {
                    const addtionalEntrace = 3
                    const startingAccountIndex = 1 //deployer 0
                    const accounts = await ethers.getSigners()
                    for (let i = startingAccountIndex; i < addtionalEntrace + startingAccountIndex; i++) {
                        const accountConnectedRaffle = await raffleContract.connect(accounts[i])
                        await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                    }
                    const statingTimeStamp = await raffleContract.getLatestTimeStamp()


                    return new Promise(async (resolve, reject) => {

                        raffleContract.once("winnerPicked", async () => {
                            console.log("found the eventS")
                            try {
                                //assert
                                const recemtWinner = await raffleContract.getWinner()
                                const raffleState = await raffleContract.getRaffleState()
                                const endingTimeStamp = await raffleContract.getLatestTimeStamp()
                                const numPlayer = await raffleContract.getNumberOfPlayers()
                                assert.equal(numPlayer, 0)
                                assert.equal(raffleState, 0)
                                assert
                                assert(endingTimeStamp > statingTimeStamp)

                            } catch (error) {
                                reject(error)
                            }
                            resolve()
                        })
                        const tx = await raffleContract.performUpkeep("0x")
                        const txReceipt = await tx.wait(1)
                        const request = await txReceipt.logs[1].args
                        await mockV3Aggregator.fulfillRandomWords(1, await raffleContract.getAddress())

                    })

                })
            })
        })
    })