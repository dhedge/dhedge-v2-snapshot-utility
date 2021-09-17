import fs from "fs";
import config from "./config";
import { assert } from "console";
import { Results } from "./get3FundInvestorSnapshots";

const investmentsPerFundPerInvestorPerBlockRaw = fs.existsSync(
  config.investmentsPerFundPerInvestorPerBlock
)
  ? fs.readFileSync(config.investmentsPerFundPerInvestorPerBlock, "utf-8")
  : "{}";

const investmentsPerFundPerInvestorPerBlock: Results = JSON.parse(
  investmentsPerFundPerInvestorPerBlockRaw.toString()
);

console.log("Existing results", investmentsPerFundPerInvestorPerBlock);

const totalRewards = config.prize;
const perBlockRewards = totalRewards / config.days; // $50,000 / 31 days

type InvestmentAmountPerInvestorGroupedByBlock = {
  [blockId: string]: { [investorId: string]: number };
};

type RewardPerInvestorGroupedByBlock = {
  [blockId: string]: { [investorId: string]: number };
};

// At each Block interval we need to know the culmulative investment amount for
// each investor across all funds.
// This sum's each investors balance across all funds for each block.
const getInvestmentAmountPerBlock = (investmentsByFund: Results) => {
  const investorInvestmentAmountPerBlock: InvestmentAmountPerInvestorGroupedByBlock =
    {};
  investmentsByFund.forEach((investmentsForFund) => {
    investmentsForFund.investorsWithBalancesPerBlockAndTotalSupply.forEach(
      (investorWithBalancesAtEachBlock) => {
        investorWithBalancesAtEachBlock.balancesAtBlocksWithTotal.forEach(
          (balancesAtBlock) => {
            if (!investorInvestmentAmountPerBlock[balancesAtBlock.block]) {
              investorInvestmentAmountPerBlock[balancesAtBlock.block] = {};
            }

            if (
              investorInvestmentAmountPerBlock[balancesAtBlock.block][
                investorWithBalancesAtEachBlock.investorID
              ] === undefined
            ) {
              investorInvestmentAmountPerBlock[balancesAtBlock.block][
                investorWithBalancesAtEachBlock.investorID
              ] = 0;
            }

            investorInvestmentAmountPerBlock[balancesAtBlock.block][
              investorWithBalancesAtEachBlock.investorID
            ] += balancesAtBlock.balance * balancesAtBlock.tokenPrice;
          }
        );
      }
    );
  });
  return investorInvestmentAmountPerBlock;
};

// Calculates the total investment across all investors for each block
// We need this value to understand what portion of the prize for each block
// to allocate to each investor investorAmountPerBlock / totalInvestmentPerBlock
const getTotalInvestmentAmountPerBlock = (
  allInvestorsInvestmentAmountsGroupedByBlock: InvestmentAmountPerInvestorGroupedByBlock
) => {
  const totalInvestmentAmountPerBlock: { [blockId: string]: number } = {};
  Object.keys(allInvestorsInvestmentAmountsGroupedByBlock).map((block) => {
    const totalAmountOfInvestmentForBlock = Object.values(
      allInvestorsInvestmentAmountsGroupedByBlock[block]
    ).reduce((acc, next) => {
      return acc + next;
    }, 0);
    totalInvestmentAmountPerBlock[block] = totalAmountOfInvestmentForBlock;
  });
  return totalInvestmentAmountPerBlock;
};

// Calculates the reward amount per investor, based on the investors balance
// captured daily over the course of the 31 days of the comp.
// A portion of the total winnings is allocated each day and distributed to
// each investor based on the amount invested that day.
const getRewardAmountPerInvestorPerBlock = (investmentsByFund: Results) => {
  const investorInvestmentAmountPerBlock =
    getInvestmentAmountPerBlock(investmentsByFund);

  const totalInvestmentAmountPerBlock = getTotalInvestmentAmountPerBlock(
    investorInvestmentAmountPerBlock
  );

  const blocks = Object.keys(investorInvestmentAmountPerBlock);

  const rewardPerInvestorPerBlock: RewardPerInvestorGroupedByBlock = {};
  blocks.forEach((block) => {
    if (!rewardPerInvestorPerBlock[block]) {
      rewardPerInvestorPerBlock[block] = {};
    }
    const investors = Object.keys(investorInvestmentAmountPerBlock[block]);
    investors.forEach((investorId) => {
      const investmentAmountForBlock =
        investorInvestmentAmountPerBlock[block][investorId] || 0;
      const totalInvestmentForBlock = totalInvestmentAmountPerBlock[block];
      const blockRewardForInvestor =
        (investmentAmountForBlock / totalInvestmentForBlock) * perBlockRewards;

      rewardPerInvestorPerBlock[block][investorId] = blockRewardForInvestor;
    });
  });

  let totalRewardsCheckSum = 0;
  blocks.forEach((block) => {
    // We check that we are only allocating the perBlockRewards
    const blockRewardCheckSum = Object.values(
      rewardPerInvestorPerBlock[block]
    ).reduce((acc, next) => {
      return acc + next;
    });

    // should equal 50,000 / 31 === 1612.903225806
    assert(
      Math.round(blockRewardCheckSum * 1000) ===
        Math.round(perBlockRewards * 1000),
      "blockReward does compute expected " +
        perBlockRewards +
        " but received " +
        blockRewardCheckSum
    );

    totalRewardsCheckSum += blockRewardCheckSum;
  });

  // Should equal 50,000
  assert(
    Math.round(totalRewardsCheckSum * 1000) === Math.round(totalRewards * 1000),
    "total rewards checksum incorrect expected " +
      totalRewards +
      " but received " +
      totalRewardsCheckSum
  );

  const totalRewardsPerInvestor: { [investorId: string]: number } = {};

  blocks.forEach((block) => {
    const investorIds = Object.keys(rewardPerInvestorPerBlock[block]);

    investorIds.forEach((investorId) => {
      if (!totalRewardsPerInvestor[investorId]) {
        totalRewardsPerInvestor[investorId] = 0;
      }
      totalRewardsPerInvestor[investorId] +=
        rewardPerInvestorPerBlock[block][investorId];
    });
  });

  const sortedRewards = Object.keys(totalRewardsPerInvestor)
    .map((investorId) => {
      return { investorId, reward: totalRewardsPerInvestor[investorId] };
    })
    .sort((a, b) => b.reward - a.reward);

  console.log("Rewards", sortedRewards);

  const rewardsJson = JSON.stringify(sortedRewards, null, 4);

  fs.writeFileSync(config.results, rewardsJson);

  const sumRewardsAllInvestors = Object.values(totalRewardsPerInvestor);
  const totalInvestorRewardsCheckSum = sumRewardsAllInvestors.reduce(
    (acc, next) => {
      return acc + next;
    },
    0
  );

  // Should equal 50,000
  assert(
    Math.round(totalInvestorRewardsCheckSum * 1000) ===
      Math.round(totalRewards * 1000)
  );
};

getRewardAmountPerInvestorPerBlock(investmentsPerFundPerInvestorPerBlock);
