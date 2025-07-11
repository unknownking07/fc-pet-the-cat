import { createPublicClient, http, Log } from "viem";
import { base } from "viem/chains";
import { abi } from "./abi";

const CONTRACT_ADDRESS = "0xE3DcD541fce641264299a7F27Af5b3DeBaaD2d8f";

const client = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL), // Use your Alchemy RPC from env
});

interface ScoreSubmittedLog extends Log {
  args: {
    player: string;
    score: bigint;
  };
}

export async function getLeaderboard(): Promise<{ address: string; score: bigint }[]> {
  const leaderboard: { address: string; score: bigint }[] = [];

  try {
    const latestBlock = await client.getBlockNumber();
    const BLOCK_CHUNK_SIZE = BigInt(500); // Alchemy's limit
    
    // Get all logs in chunks of 500 blocks
    const allLogs: ScoreSubmittedLog[] = [];
    
    for (let fromBlock = BigInt(0); fromBlock <= latestBlock; fromBlock += BLOCK_CHUNK_SIZE) {
      const toBlock = fromBlock + BLOCK_CHUNK_SIZE - BigInt(1) > latestBlock 
        ? latestBlock 
        : fromBlock + BLOCK_CHUNK_SIZE - BigInt(1);
      
      const logs = await client.getLogs({
        address: CONTRACT_ADDRESS,
        abi,
        eventName: "ScoreSubmitted",
        fromBlock,
        toBlock,
      }) as ScoreSubmittedLog[];
      
      allLogs.push(...logs);
    }

    const scoreMap = new Map<string, bigint>();

    allLogs.forEach((log: ScoreSubmittedLog) => {
      const player = log.args.player;
      const score = log.args.score;

      if (!scoreMap.has(player) || score > scoreMap.get(player)!) {
        scoreMap.set(player, score);
      }
    });

    scoreMap.forEach((score, address) => {
      leaderboard.push({ address, score });
    });

    leaderboard.sort((a, b) => Number(b.score - a.score));

    return leaderboard.slice(0, 10); // top 10
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return []; // Return empty array on error
  }
}