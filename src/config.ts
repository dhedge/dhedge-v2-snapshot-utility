import PoolFactoryAbi from "../abi/PoolFactoryAbi";
import PoolLogicAbi from "../abi/PoolLogicAbi";

const config = {
  // Because investors could have entered before the trading comp starts
  // This cannot be the same as the startDate and endDate of the comp :/
  investorEnteredBlockStart: 17495370, //17000000,
  investorEnteredBlockEnd: 17644934,

  snapShotStartDate: "2021-08-01T12:00:00Z",
  snapShotEndDate: "2021-08-05T12:00:00Z",

  deployedFundsFile: "deployedFunds.json",
  fundToInvestorsFile: "fundToInvestors.json",
  dateBlocksFile: "dateBlocks.json",
  resultsFile: "results.json",

  alchemyUrl:
    "https://polygon-mainnet.g.alchemy.com/v2/5fwlN7S8XXrs6q1CeWBPL4mYyhius8yM",
  poolFactoryAddress: "0xfdc7b8bFe0DD3513Cc669bB8d601Cb83e2F69cB0",
  PoolFactoryAbi,
  PoolLogicAbi,
};

export default config;
