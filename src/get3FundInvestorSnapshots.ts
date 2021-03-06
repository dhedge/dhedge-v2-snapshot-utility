import fs from "fs";
import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "ethers";
import config from "./config";
import { PoolLogicServiceFactory } from "./factory/PoolLogicServiceFactory";
import { winningFundsFile, FundWithInvestors } from "./get1InvestorsForFunds";
import { DateBlocks, getDateBlock } from "./lib/getDateBlocks";
import { assert } from "console";

const alchemyProvider = new ethers.providers.JsonRpcProvider(config.alchemyUrl);
const poolLogicServiceFactory = new PoolLogicServiceFactory(alchemyProvider);

export const toHumanNumber = (
  number: BigNumber,
  decimals: BigNumber
): number => {
  return (number as any) / 10 ** (decimals as any);
};

const dateBlocksRaw = fs.existsSync(config.dateBlocksFile)
  ? fs.readFileSync(config.dateBlocksFile, "utf-8")
  : "[]";

const dateBlocks: DateBlocks[] = JSON.parse(dateBlocksRaw.toString());

console.log("DateBlocks.json", dateBlocks.length);

assert(
  dateBlocks.length,
  "Must have date blocks. Run getDateBlocksAtDailyInterval.ts"
);

const winningFundsFileRaw = fs.existsSync(config.winningFundsFile)
  ? fs.readFileSync(config.winningFundsFile, "utf-8")
  : "[]";

const winningFundsFile: winningFundsFile[] = JSON.parse(
  winningFundsFileRaw.toString()
);

const fundToInvestorsRaw = fs.existsSync(config.fundToInvestorsFile)
  ? fs.readFileSync(config.fundToInvestorsFile, "utf-8")
  : "{}";

const fundsWithInvestors: FundWithInvestors[] = JSON.parse(
  fundToInvestorsRaw.toString()
);

console.log("Existing fund investor state", fundsWithInvestors);

export type Results = {
  fundId: string;
  investorsWithBalancesPerBlockAndTotalSupply: {
    investorID: string;
    balancesAtBlocksWithTotal: {
      balance: number;
      block: number;
      totalSupply: number;
      tokenPrice: number;
    }[];
  }[];
}[];

const blocks = dateBlocks.map((dbs) => dbs.block);
Promise.all(
  fundsWithInvestors.map(async (fundWithInvestors) => {
    const fundId = fundWithInvestors.fundId;
    const poolLogicService = poolLogicServiceFactory.getInstance(fundId);

    const enteredCompDate = winningFundsFile.find(
      (deployedFund) => deployedFund.fundId === fundId
    )?.enteredCompAtDate;
    if (!enteredCompDate) {
      throw new Error("No Entered Comp Date");
    }

    // Investor balances only count after the pool officially entered the comp
    const blockStart = await getDateBlock(enteredCompDate);
    const includedBlocks = blocks.filter((block) => block >= blockStart.block);

    console.log("FundBlocks: ", fundId, includedBlocks.length);

    console.log(
      "Fetching Total Supply for Each Block Interval for fund: ",
      fundId
    );
    const totalSupplyByBlock: Record<
      number,
      { totalSupply: ethers.BigNumber; tokenPrice: ethers.BigNumber }
    > = await poolLogicService.getTotalSupplyAndPriceAtBlocks(includedBlocks);

    const investors = fundWithInvestors.investors || [];

    console.log(
      "Fetching Balance at Block for each Investor At Each Block Interval for fund: ",
      fundId
    );

    const investorsWithBalancesPerBlock = await Promise.all(
      investors.map(async (investorId) => {
        const balancesAtBlocks = await poolLogicService.getBalanceAtBlocks(
          investorId,
          includedBlocks
        );
        return { investorId, balancesAtBlocks };
      })
    );
    const investorsWithBalancesPerBlockAndTotalSupply =
      investorsWithBalancesPerBlock.map((x) => {
        const balancesAtBlocksWithTotal = x.balancesAtBlocks.map((bb) => {
          return {
            balance: toHumanNumber(bb.balance, BigNumber.from(18)),
            block: bb.block,
            totalSupply: toHumanNumber(
              totalSupplyByBlock[bb.block].totalSupply,
              BigNumber.from(18)
            ),
            tokenPrice: toHumanNumber(
              totalSupplyByBlock[bb.block].tokenPrice,
              BigNumber.from(18)
            ),
          };
        });
        return { investorID: x.investorId, balancesAtBlocksWithTotal };
      });

    return { fundId, investorsWithBalancesPerBlockAndTotalSupply };
  })
).then((fundsWithInvestorsAndBalanceSnapshots: Results) => {
  const fundsWithInvestorsAndBalanceSnapshotsJSON = JSON.stringify(
    fundsWithInvestorsAndBalanceSnapshots,
    null,
    4
  );
  fs.writeFile(
    config.investmentsPerFundPerInvestorPerBlock,
    fundsWithInvestorsAndBalanceSnapshotsJSON,
    function (err) {
      if (err) {
        console.error(err);
      }
      console.log("Success");
    }
  );
});
