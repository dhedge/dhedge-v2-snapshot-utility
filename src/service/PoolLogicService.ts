import { BigNumber, ethers } from "ethers";
import config from "../config";
import { executeInSeries } from "../lib/executeInSeries";

const MAX_BLOCKS = 50000;

export class PoolLogicService {
  constructor(private poolLogicContract: ethers.Contract) {}

  getBalanceAtBlocks(
    investorId: string,
    blocks: number[]
  ): Promise<{ block: number; balance: BigNumber }[]> {
    return Promise.all(
      blocks.map((block) => {
        return this.getBalanceAtBlock(investorId, block)
          .then((balance) => {
            return { balance, block };
          })
          .catch(() => {
            // Sometimes the contract doesn't exist at the block we're executing at
            // Need to more specifically handle this error
            // web3.eth.getCode(fundId, block) !== "0x"
            return { balance: BigNumber.from(0), block: block };
          });
      })
    );
  }

  private getBalanceAtBlock(
    investorId: string,
    blockNumber: number
  ): Promise<BigNumber> {
    const balance$ = this.poolLogicContract.balanceOf(investorId, {
      blockTag: blockNumber,
    });
    return balance$;
  }

  private getTotalSupplyAndPriceAtBlock(
    blockNumber: number
  ): Promise<{ totalSupply: ethers.BigNumber; tokenPrice: ethers.BigNumber }> {
    const totalSupply$: Promise<ethers.BigNumber> =
      this.poolLogicContract.totalSupply({
        blockTag: blockNumber,
      });
    const tokenPrice$: Promise<ethers.BigNumber> =
      this.poolLogicContract.tokenPrice({
        blockTag: blockNumber,
      });

    return Promise.all([totalSupply$, tokenPrice$]).then(
      ([totalSupply, tokenPrice]) => {
        return { totalSupply, tokenPrice };
      }
    );
  }

  getTotalSupplyAndPriceAtBlocks(
    blocks: number[]
  ): Promise<
    Record<
      number,
      { totalSupply: ethers.BigNumber; tokenPrice: ethers.BigNumber }
    >
  > {
    return Promise.all(
      blocks.map((block) => {
        return this.getTotalSupplyAndPriceAtBlock(block)
          .then((totalSupplyAndTokenPrice) => {
            return { block, ...totalSupplyAndTokenPrice };
          })
          .catch(() => {
            // Sometimes the contract doesn't exist at the block we're executing at
            // Need to more specifically handle this error
            // web3.eth.getCode(fundId, block) !== "0x"
            return {
              block,
              totalSupply: BigNumber.from(0),
              tokenPrice: BigNumber.from(0),
            };
          });
      })
    ).then((totalSupplyBlocks) => {
      return totalSupplyBlocks.reduce((acc, blockWithSupply) => {
        acc[blockWithSupply.block] = blockWithSupply;
        return acc;
      }, {} as Record<number, { totalSupply: ethers.BigNumber; tokenPrice: ethers.BigNumber }>);
    });
  }

  getInvestors(): Promise<string[] | undefined> {
    // We gently caress 🪶 alchemy into fetching the events for many 100,000's of blocks
    // By splitting our requests into 50k block blocks 😎
    const chunks: { blockStart: number; blockEnd: number }[] = [];
    let end = config.investorEnteredBlockEnd;
    while (end > config.investorEnteredBlockStart) {
      chunks.push({
        blockEnd: end,
        blockStart: Math.max(
          end - MAX_BLOCKS,
          config.investorEnteredBlockStart
        ),
      });
      end = end - MAX_BLOCKS;
    }

    console.log("Event Request Chunks", chunks);

    const eventPromiseProviders = chunks.map((chunk) => () => {
      const events = this.poolLogicContract.queryFilter(
        this.poolLogicContract.filters.Deposit(),
        // This is the chunk 🪄
        chunk.blockStart,
        chunk.blockEnd
      );

      return events;
    });

    return executeInSeries(eventPromiseProviders)
      .then((eventsNested) => {
        const allEvents = ([] as ethers.Event[]).concat(...eventsNested);
        const uniqInvestors = allEvents
          // We only want the investor id, lets get it from the event
          .map((ev) => {
            const investorAddress = ev.args && ev.args["investor"];
            console.log("InvestorAddress found:", investorAddress);
            return investorAddress;
          })
          // Lets get rid of duplicate investor id's here
          .reduce((acc: Set<string>, investorId) => {
            acc.add(investorId);
            return acc;
          }, new Set<string>());

        return Array.from(uniqInvestors);
      })
      .catch((e) => {
        console.log(e);
        console.log(
          "If this error is a timeout it is recoverable, re-run script"
        );
        return undefined;
      });
  }
}
