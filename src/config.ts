import PoolFactoryAbi from "../abi/PoolFactoryAbi";
import PoolLogicAbi from "../abi/PoolLogicAbi";

const config = {
  // Because investors could have entered before the trading comp starts
  // This cannot be the same as the startDate and endDate of the comp :/
  // It should be the earliest block a winning fund was createed.
  investorEnteredBlockStart: 642351, // Some time in early december 2021
  investorEnteredBlockEnd: 2483267, // End of Comp
  prize: 70000,
  days: 31,
  snapShotStartDate: "2021-12-22T00:00:00Z",
  snapShotEndDate: "2022-01-21T00:00:00Z",

  winningFundsFile: "winningFunds.json",
  fundToInvestorsFile: "fundToInvestors.json",
  dateBlocksFile: "dateBlocks.json",
  investmentsPerFundPerInvestorPerBlock:
    "investmentsPerFundPerInvestorPerBlock.json",
  results: "results.json",

  alchemyUrl:
    "https://opt-mainnet.g.alchemy.com/v2/gybIhe6vRvfkrNiIi8ZhHbl_okiuyNd2",
  poolFactoryAddress: "0x5e61a079A178f0E5784107a4963baAe0c5a680c6",
  PoolFactoryAbi,
  PoolLogicAbi,
};

export default config;
