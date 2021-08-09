import fs from "fs";
import { ethers } from "ethers";
import config from "./config";

console.log("Fetching all funds to: ", config.deployedFundsFile);

const alchemyProvider = new ethers.providers.JsonRpcProvider(config.alchemyUrl);

const poolFactoryContract = new ethers.Contract(
  config.poolFactoryAddress,
  config.PoolFactoryAbi,
  alchemyProvider
);

const deployedFunds$ = poolFactoryContract.getDeployedFunds();

deployedFunds$.then((deployedFunds: string[]) => {
  const deployedFundsJSON = JSON.stringify(deployedFunds, null, 4);

  fs.writeFile(config.deployedFundsFile, deployedFundsJSON, function (err) {
    if (err) {
      console.error(err);
    }
    console.log("Success");
    console.log(deployedFunds);
  });
});
