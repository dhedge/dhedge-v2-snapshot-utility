import PoolFactoryAbi from "../abi/PoolFactoryAbi";
import PoolLogicAbi from "../abi/PoolLogicAbi";

const config = {
  // Because investors could have entered before the trading comp starts
  // This cannot be the same as the startDate and endDate of the comp :/
  investorEnteredBlockStart: 17495370, // Aug-01-2021 12:00:07 PM +UTC
  investorEnteredBlockEnd: 19115834, // Sep-15-2021 12:00:00 AM +UTC
  prize: 50000,
  days: 31,
  snapShotStartDate: "2021-08-16T00:00:00Z",
  snapShotEndDate: "2021-09-15T00:00:00Z",

  winningFundsFile: "winningFunds.json",
  fundToInvestorsFile: "fundToInvestors.json",
  dateBlocksFile: "dateBlocks.json",
  investmentsPerFundPerInvestorPerBlock:
    "investmentsPerFundPerInvestorPerBlock.json",
  results: "results.json",

  alchemyUrl:
    "https://polygon-mainnet.g.alchemy.com/v2/5fwlN7S8XXrs6q1CeWBPL4mYyhius8yM",
  poolFactoryAddress: "0xfdc7b8bFe0DD3513Cc669bB8d601Cb83e2F69cB0",
  PoolFactoryAbi,
  PoolLogicAbi,
};

export default config;
