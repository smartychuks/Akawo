const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { AKAWO_TOKEN_CONTRACT_ADDRESS} = require("../constants");

async function main() {
  const akawoTokenAddress = AKAWO_TOKEN_CONTRACT_ADDRESS;
  const exchange = await ethers.getContractFactory("Exchange");
  const deployedExchange = await exchange.deploy(akawoTokenAddress);
  await deployedExchange.deployed();

  // print the contract address
  console.log("Exchange contract was deployed to: ", deployedExchange.address);
}

// Error management
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });