const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

async function main(){
  const Akawo = await ethers.getContractFactory("Akawo");
  const akawoDeploy = await Akawo.deploy();

  await akawoDeploy.deployed();

  console.log("Akawo was deployed to:", akawoDeploy.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});