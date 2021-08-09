# Dhedge Trading Comp Data

The scripts in this repo are to collect the investor snapshot information required to distribute the winnings for trading competitions.

It is configurable by changing the `config.ts` file.

In this repo there are 4 main files:

1. `getDeployedFunds.ts`
 - This uses the publicly available `getDeployedFunds` on the PoolFactory.sol to get all pools. Outputs the list to config.deployedFundsFile.
2. `getInvestorsForFunds.ts`
 - This file subscribes and listens for all Deposit events from config{investorEnteredBlockStart to investorEnteredBlockEnd} for all pools and collects the Investor Addresses. It outputs this to config.fundToInvestorsFile.
 - This file does some significant batching as to avoid provider timeouts. It can be rerun AFTER it finishes if any of it's jobs fail i.e it can self heal. It wont refetch already fetched events.
 - This takes significant time.
3. `getDateBlocks`
 - This file gets the block numbers at a daily interval between config{snapShotStartDate, snapShotEndDate}. It outputs this to config.dateBlocksFile
 - This is intensive for the provider.
4. `getFundInvestorSnapshots.ts`
 - This gets historical balances for all investors in all funds for all blocks in config.dateBlocksFile. Outputs to config.resultsFile
 - This currently has no batching because the providers seem to handle these requests ok.

They should be run in order with `ts-node` src/`file.ts`. Splitting them up allows us to retry the failures in the 4 steps without having to re-run the entire download.

If you don't have it you can install `ts-node` with:
```
npm install -g ts-node
```

If you're are feeling lucky 🍀🧧 you can create a file that calls them in order.


## How does this work?

1. PoolFactory.sol has a public method `getDeployedFunds` that gets us the fund addresses.
2. Unfortunately PoolLogic.sol does not have a public method to get a list of investors. This means we must listen to deposit events from our chosen epoch for each of our pools. Deposit events contain the investorAddress. We collect them all and deduplicate them.
3. We use a third party utility that gets us block numbers at 24 hour intervals between the dates of our competition. `EthDater`.
4. To get the balance snapshots we make a `PoolLogic.balanceOf` call at a specific blockTag. `eth_call` allows a blockTag in its override parameters. This means the call is execute against this block.
