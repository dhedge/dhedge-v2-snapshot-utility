import fs from "fs";
import { ethers } from "ethers";
import config from "../config";

console.log("Fetching all funds to: ", config.winningFundsFile);

const alchemyProvider = new ethers.providers.JsonRpcProvider(config.alchemyUrl);

const poolFactoryContract = new ethers.Contract(
  config.poolFactoryAddress,
  config.PoolFactoryAbi,
  alchemyProvider
);

const winningFundsFile$ = poolFactoryContract.getwinningFundsFile();

winningFundsFile$.then((winningFundsFile: string[]) => {
  const winningFundsFileJSON = JSON.stringify(winningFundsFile, null, 4);

  fs.writeFile(config.winningFundsFile, winningFundsFileJSON, function (err) {
    if (err) {
      console.error(err);
    }
    console.log("Success");
    console.log(winningFundsFile);
  });
});
