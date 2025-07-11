import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";

const contractAddress = "0xE3DcD541fce641264299a7F27Af5b3DeBaaD2d8f";

// ✅ Get leaderboard from recent blocks (much faster)
export async function getLeaderboard(fromBlocksAgo: number = 5000): Promise<
  { address: string; score: bigint }[]
> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http("https://base-mainnet.g.alchemy.com/v2/yKZCAarfw64JvLWyySYJH"),
    });

    // Get current block number and calculate from block
    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock - BigInt(fromBlocksAgo);

    console.log(`📊 Fetching leaderboard from block ${fromBlock} to ${currentBlock}`);

    const logs = await client.getLogs({
      address: contractAddress,
      event: parseAbiItem(
        "event ScoreSubmitted(address indexed player, uint256 score)"
      ),
      fromBlock,
      toBlock: "latest",
    });

    console.log(`📋 Found ${logs.length} score events in recent blocks`);

    const scores = new Map<string, bigint>();
    
    // Process logs in chronological order
    for (const log of logs) {
      if (!log.args) {
        console.warn("⚠️ Log missing args:", log);
        continue;
      }

      const { player, score } = log.args as {
        player: `0x${string}`;
        score: bigint;
      };

      if (!player || score === undefined) {
        console.warn("⚠️ Invalid log args:", log.args);
        continue;
      }

      // Convert to lowercase for consistent comparison
      const playerLower = player.toLowerCase();
      const prev = scores.get(playerLower);
      
      // Only keep the highest score for each player
      if (!prev || score > prev) {
        scores.set(playerLower, score);
        console.log(`🏆 Updated score for ${playerLower}: ${score.toString()}`);
      }
    }

    console.log(`👥 Processed scores for ${scores.size} unique players`);

    // Convert to array and sort by score (highest first)
    const leaderboard = [...scores.entries()]
      .map(([address, score]) => ({ address, score }))
      .sort((a, b) => {
        // Handle BigInt comparison properly
        if (a.score > b.score) return -1;
        if (a.score < b.score) return 1;
        return 0;
      })
      .slice(0, 10); // Limit to top 10

    console.log("🎯 Final leaderboard:", leaderboard.map(entry => ({
      address: entry.address,
      score: entry.score.toString()
    })));

    return leaderboard;

  } catch (error) {
    console.error("❌ Failed to fetch leaderboard:", error);
    
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

// ✅ Fallback function to get all historical data (slower but comprehensive)
export async function getFullLeaderboard(): Promise<
  { address: string; score: bigint }[]
> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http("https://base-mainnet.g.alchemy.com/v2/yKZCAarfw64JvLWyySYJH"),
    });

    console.log("📊 Fetching FULL leaderboard (this may take longer...)");

    const logs = await client.getLogs({
      address: contractAddress,
      event: parseAbiItem(
        "event ScoreSubmitted(address indexed player, uint256 score)"
      ),
      fromBlock: BigInt("20000000"), // Your original starting block
      toBlock: "latest",
    });

    console.log(`📋 Found ${logs.length} total score events`);

    const scores = new Map<string, bigint>();
    
    for (const log of logs) {
      if (!log.args) continue;

      const { player, score } = log.args as {
        player: `0x${string}`;
        score: bigint;
      };

      if (!player || score === undefined) continue;

      const playerLower = player.toLowerCase();
      const prev = scores.get(playerLower);
      
      if (!prev || score > prev) {
        scores.set(playerLower, score);
      }
    }

    console.log(`👥 Processed scores for ${scores.size} unique players`);

    return [...scores.entries()]
      .map(([address, score]) => ({ address, score }))
      .sort((a, b) => {
        if (a.score > b.score) return -1;
        if (a.score < b.score) return 1;
        return 0;
      })
      .slice(0, 10);

  } catch (error) {
    console.error("❌ Failed to fetch full leaderboard:", error);
    return [];
  }
}

// ✅ Get leaderboard for a specific player
export async function getPlayerScore(playerAddress: string): Promise<bigint | null> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http("https://base-mainnet.g.alchemy.com/v2/yKZCAarfw64JvLWyySYJH"),
    });

    const logs = await client.getLogs({
      address: contractAddress,
      event: parseAbiItem(
        "event ScoreSubmitted(address indexed player, uint256 score)"
      ),
      args: {
        player: playerAddress as `0x${string}`,
      },
      fromBlock: BigInt("20000000"),
      toBlock: "latest",
    });

    if (logs.length === 0) return null;

    // Find the highest score for this player
    let highestScore = BigInt(0);
    for (const log of logs) {
      if (log.args?.score && log.args.score > highestScore) {
        highestScore = log.args.score;
      }
    }

    return highestScore;

  } catch (error) {
    console.error("❌ Failed to fetch player score:", error);
    return null;
  }
}