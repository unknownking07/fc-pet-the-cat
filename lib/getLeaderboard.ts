import { Alchemy, Log, Network } from "alchemy-sdk";
import { ethers } from "ethers";
import { abi } from "./abi";

const config = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
  network: Network.BASE_MAINNET,
};

const provider = new Alchemy(config);
const contractAddress = "0xf64d1D8c1F6e8F0e0dFe676Af84f69cA3A3B0482";
const iface = new ethers.utils.Interface(abi);

function parseLogs(logs: Log[]): { address: string; score: bigint }[] {
  const leaderboard: { address: string; score: bigint }[] = [];

  for (const log of logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === "ScoreSubmitted") {
        leaderboard.push({
          address: parsed.args.player.toLowerCase(),
          score: parsed.args.score,
        });
      }
    } catch {
      // Ignore logs that aren't ScoreSubmitted
    }
  }

  return leaderboard;
}

export async function getLeaderboard(blocks = 10000) {
  const latestBlock = await provider.core.getBlockNumber();
  const fromBlock = latestBlock - blocks;

  try {
    const logs = await provider.core.getLogs({
      address: contractAddress,
      fromBlock,
      toBlock: "latest",
      topics: [ethers.utils.id("ScoreSubmitted(address,uint256)")],
    });

    return parseLogs(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
}

export async function getFullLeaderboard() {
  const fromBlock = 19000000;

  try {
    const logs = await provider.core.getLogs({
      address: contractAddress,
      fromBlock,
      toBlock: "latest",
      topics: [ethers.utils.id("ScoreSubmitted(address,uint256)")],
    });

    return parseLogs(logs);
  } catch (error) {
    console.error("Error fetching full leaderboard:", error);
    return [];
  }
}
