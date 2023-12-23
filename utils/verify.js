const { run } = require("hardhat");

const verify = async function (contractAddress, arg) {
    console.log("verifying contract pls wait ...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: arg,
        });
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Aleady verified")
        }
        else {
            console.log(e)
        }
    }
}

module.exports = {
    verify
}