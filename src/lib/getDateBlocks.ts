import { ethers } from "ethers";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EthDater = require("ethereum-block-by-date");

import config from "../config";

export interface DateBlocks {
  date: string;
  block: number;
}

export const getDateBlocksAtDailyInterval = (
  startDate: string,
  endDate: string
): Promise<DateBlocks[]> => {
  const alchemyProvider = new ethers.providers.JsonRpcProvider(
    config.alchemyUrl
  );

  const dater = new EthDater(
    alchemyProvider // Ethers provider, required.
  );
  //  { date: '2019-09-02T12:00:00Z', block: 8470641, timestamp: 1567425601 },[]
  const dateBlocks$: Promise<DateBlocks[]> = dater.getEvery(
    "days", // Period, required. Valid value: years, quarters, months, weeks, days, hours, minutes
    startDate, //"2019-09-02T12:00:00Z", // Start date, required. Any valid moment.js value: string, milliseconds, Date() object, moment() object.
    endDate //"2019-09-30T12:00:00Z", // End date, required. Any valid moment.js value: string, milliseconds, Date() object, moment() object.
  );

  return dateBlocks$;
};

export const getDateBlocks = (
  startDate: string,
  endDate: string
): Promise<DateBlocks[]> => {
  const alchemyProvider = new ethers.providers.JsonRpcProvider(
    config.alchemyUrl
  );

  const dater = new EthDater(
    alchemyProvider // Ethers provider, required.
  );

  return Promise.all(
    [startDate, endDate].map((date) => {
      //  { date: '2019-09-02T12:00:00Z', block: 8470641, timestamp: 1567425601 },[]
      return dater.getDate(date);
    })
  );
};

export const getDateBlock = (date: string): Promise<DateBlocks> => {
  const alchemyProvider = new ethers.providers.JsonRpcProvider(
    config.alchemyUrl
  );

  const dater = new EthDater(
    alchemyProvider // Ethers provider, required.
  );

  return dater.getDate(date);
};
