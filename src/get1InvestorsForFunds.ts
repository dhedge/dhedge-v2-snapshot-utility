import { ethers } from "ethers";
import fs from "fs";
import config from "./config";
import { executeInSeries } from "./lib/executeInSeries";
import { PoolLogicServiceFactory } from "./factory/PoolLogicServiceFactory";

const alchemyProvider = new ethers.providers.JsonRpcProvider(config.alchemyUrl);
const poolLogicServiceFactory = new PoolLogicServiceFactory(alchemyProvider);

export type FundWithInvestors = {
  fundId: string;
  investors: string[] | undefined;
};

export type winningFundsFile = {
  fundId: string;
  enteredCompAtDate: string;
};

const winningFundsFileRaw = fs.existsSync(config.winningFundsFile)
  ? fs.readFileSync(config.winningFundsFile, "utf-8")
  : "[]";

const winningFundsFile: winningFundsFile[] = JSON.parse(
  winningFundsFileRaw.toString()
);

console.log("Fetching investors for funds: ", winningFundsFile);

const fundToInvestorsRaw = fs.existsSync(config.fundToInvestorsFile)
  ? fs.readFileSync(config.fundToInvestorsFile, "utf-8")
  : "[]";

const existingFundsWithInvestors: FundWithInvestors[] = JSON.parse(
  fundToInvestorsRaw.toString()
);

console.log("Existing fund investor state", existingFundsWithInvestors);

const investorsPromises = winningFundsFile
  .filter((deployedFund) => {
    const alreadyExists = existingFundsWithInvestors.find(
      (x) => x.fundId === deployedFund.fundId
    );
    // So that we can run this script again if it fails we only refetch
    // Investors for funds that have failed (are undefined) previously
    return !alreadyExists?.investors;
  })
  .map(({ fundId }) => {
    return async () => {
      console.log("Fetching all investors for fund: ", fundId);
      const investors = await poolLogicServiceFactory
        .getInstance(fundId)
        .getInvestors()
        .catch(() => undefined);
      const downloadedFundsWithInvestors = [{ fundId, investors }];

      const fundToInvestorsRaw = fs.existsSync(config.fundToInvestorsFile)
        ? fs.readFileSync(config.fundToInvestorsFile, "utf-8")
        : "[]";

      const existingFundsWithInvestors: FundWithInvestors[] = JSON.parse(
        fundToInvestorsRaw.toString()
      );

      const newFundsWithInvestors = [
        ...existingFundsWithInvestors.filter((x) => x.investors),
        ...downloadedFundsWithInvestors,
      ];

      const fundToInvestorsJson = JSON.stringify(
        newFundsWithInvestors,
        null,
        4
      );

      fs.writeFile(
        config.fundToInvestorsFile,
        fundToInvestorsJson,
        function (err) {
          if (err) {
            console.error(err);
          }
          console.log("Success");
          console.log("Fund Investors:", newFundsWithInvestors);
        }
      );
    };
  });

executeInSeries(investorsPromises);
