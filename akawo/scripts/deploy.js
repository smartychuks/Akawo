const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

async function main(){
  const Akawo = await ethers.getContractFactory("Akawo");
  const akawoDeploy = await Akawo.deploy("0xf773e8fAdc25F35d43355a1204218a5E4B8529de");

  await akawoDeploy.deployed();

  console.log("Akawo was deployed to:", akawoDeploy.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});