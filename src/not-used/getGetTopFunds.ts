import { ethers } from "ethers";
import fs from "fs";
import config from "../config";
import { PoolLogicServiceFactory } from "../factory/PoolLogicServiceFactory";
import { getDateBlocks } from "../lib/getDateBlocks";

const alchemyProvider = new ethers.providers.JsonRpcProvider(config.alchemyUrl);
const poolLogicServiceFactory = new PoolLogicServiceFactory(alchemyProvider);

const winningFundsFileRaw = fs.existsSync(config.winningFundsFile)
  ? fs.readFileSync(config.winningFundsFile, "utf-8")
  : "[]";

const winningFundsFile: string[] = JSON.parse(winningFundsFileRaw.toString());

console.log(
  "Fetching tokenPrice and sorting " + winningFundsFile.length + " funds."
);

const dateBlocks = getDateBlocks(
  config.snapShotStartDate,
  config.snapShotEndDate
);

dateBlocks.then(async (dateBlocks) => {
  console.log(dateBlocks);
  const fundWithPriceChange = await Promise.all(
    winningFundsFile.map(async (fundId) => {
      const blockToPriceMap = await poolLogicServiceFactory
        .getInstance(fundId)
        .getTotalSupplyAndPriceAtBlocks(dateBlocks.map((db) => db.block));
      const [start, end] = Object.values(blockToPriceMap);
      console.log(
        fundId,
        start.tokenPrice.toString(),
        end.tokenPrice.toString(),
        ethers.utils.formatEther(end.tokenPrice.sub(start.tokenPrice))
      );
      return {
        fundId,
        start: ethers.utils.formatEther(start.tokenPrice),
        end: ethers.utils.formatEther(end.tokenPrice),
        priceChange: ethers.utils.formatEther(
          end.tokenPrice.sub(start.tokenPrice)
        ),
      };
    })
  );

  // descending order, bigger price change bigger performance
  const x = fundWithPriceChange.sort((a, b) => {
    return parseFloat(b.priceChange) - parseFloat(a.priceChange);
  });

  const winningFundsFileJSON = JSON.stringify(x, null, 4);

  fs.writeFile(config.winningFundsFile, winningFundsFileJSON, function (err) {
    if (err) {
      console.error(err);
    }
    console.log("Success");
    console.log(winningFundsFile);
  });
});
