import { ethers } from "ethers";
import config from "../config";
import { PoolLogicService } from "../service/PoolLogicService";

export class PoolLogicServiceFactory {
  constructor(private provider: ethers.providers.JsonRpcProvider) {}

  private getPoolLogicContract(fundId: string): ethers.Contract {
    const poolLogicContract = new ethers.Contract(
      fundId,
      config.PoolLogicAbi,
      this.provider
    );

    return poolLogicContract;
  }

  getInstance(fundId: string): PoolLogicService {
    return new PoolLogicService(this.getPoolLogicContract(fundId));
  }
}
