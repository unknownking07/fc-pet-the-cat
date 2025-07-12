import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";

const contractAddress = "0xE3DcD541fce641264299a7F27Af5b3DeBaaD2d8f";

// ✅ Enhanced leaderboard function with better error handling
export async function getLeaderboard(fromBlocksAgo: number = 10000): Promise<
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
    console.log(`📊 Searching last ${fromBlocksAgo} blocks`);

    const logs = await client.getLogs({
      address: contractAddress,
      event: parseAbiItem(
        "event ScoreSubmitted(address indexed player, uint256 score)"
      ),
      fromBlock,
      toBlock: "latest",
    });

    console.log(`📋 Found ${logs.length} score events in recent blocks`);

    if (logs.length === 0) {
      console.log("⚠️ No events found in recent blocks. Contract might be new or events are older.");
      return [];
    }

    const scores = new Map<string, bigint>();
    let processedEvents = 0;
    
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

      processedEvents++;
      
      // Convert to lowercase for consistent comparison
      const playerLower = player.toLowerCase();
      const prev = scores.get(playerLower);
      
      // Only keep the highest score for each player
      if (!prev || score > prev) {
        scores.set(playerLower, score);
        console.log(`🏆 Updated score for ${playerLower}: ${score.toString()}`);
      }
    }

    console.log(`✅ Processed ${processedEvents} valid events`);
    console.log(`👥 Unique players: ${scores.size}`);

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
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

// ✅ Enhanced full leaderboard function
export async function getFullLeaderboard(): Promise<
  { address: string; score: bigint }[]
> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http("https://base-mainnet.g.alchemy.com/v2/yKZCAarfw64JvLWyySYJH"),
    });

    console.log("📊 Fetching FULL leaderboard from contract deployment...");

    // Try to get contract creation block first
    let fromBlock = BigInt("20000000"); // Your fallback starting block
    
    try {
      // You can get the actual deployment block by checking the contract creation transaction
      // For now, using the fallback block
      console.log(`📊 Using block ${fromBlock} as starting point`);
    } catch (blockError) {
      console.warn("⚠️ Could not determine contract creation block, using fallback");
    }

    const logs = await client.getLogs({
      address: contractAddress,
      event: parseAbiItem(
        "event ScoreSubmitted(address indexed player, uint256 score)"
      ),
      fromBlock,
      toBlock: "latest",
    });

    console.log(`📋 Found ${logs.length} total score events in full history`);

    if (logs.length === 0) {
      console.log("⚠️ No events found in full history. Contract might not have any submissions yet.");
      return [];
    }

    const scores = new Map<string, bigint>();
    let processedEvents = 0;
    
    for (const log of logs) {
      if (!log.args) continue;

      const { player, score } = log.args as {
        player: `0x${string}`;
        score: bigint;
      };

      if (!player || score === undefined) continue;

      processedEvents++;
      const playerLower = player.toLowerCase();
      const prev = scores.get(playerLower);
      
      if (!prev || score > prev) {
        scores.set(playerLower, score);
      }
    }

    console.log(`✅ Processed ${processedEvents} valid events from full history`);
    console.log(`👥 Unique players in full history: ${scores.size}`);

    const leaderboard = [...scores.entries()]
      .map(([address, score]) => ({ address, score }))
      .sort((a, b) => {
        if (a.score > b.score) return -1;
        if (a.score < b.score) return 1;
        return 0;
      })
      .slice(0, 10);

    console.log("🎯 Full history leaderboard:", leaderboard.map(entry => ({
      address: entry.address,
      score: entry.score.toString()
    })));

    return leaderboard;

  } catch (error) {
    console.error("❌ Failed to fetch full leaderboard:", error);
    
    if (error instanceof Error) {
      console.error("Full history error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500) + "..."
      });
    }
    
    return [];
  }
}

// ✅ Enhanced player score function
export async function getPlayerScore(playerAddress: string): Promise<bigint | null> {
  try {
    console.log(`🔍 Fetching score for player: ${playerAddress}`);
    
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
        player: playerAddress.toLowerCase() as `0x${string}`,
      },
      fromBlock: BigInt("20000000"),
      toBlock: "latest",
    });

    console.log(`📋 Found ${logs.length} score events for player ${playerAddress}`);

    if (logs.length === 0) return null;

    // Find the highest score for this player
    let highestScore = BigInt(0);
    for (const log of logs) {
      if (log.args?.score && log.args.score > highestScore) {
        highestScore = log.args.score;
      }
    }

    console.log(`🏆 Highest score for ${playerAddress}: ${highestScore.toString()}`);
    return highestScore;

  } catch (error) {
    console.error("❌ Failed to fetch player score:", error);
    return null;
  }
}

// ✅ Debug function to check recent transactions
export async function debugRecentTransactions(): Promise<void> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http("https://base-mainnet.g.alchemy.com/v2/yKZCAarfw64JvLWyySYJH"),
    });

    const currentBlock = await client.getBlockNumber();
    console.log(`🔍 Current block: ${currentBlock}`);

    // Check last 1000 blocks for any activity
    const logs = await client.getLogs({
      address: contractAddress,
      event: parseAbiItem(
        "event ScoreSubmitted(address indexed player, uint256 score)"
      ),
      fromBlock: currentBlock - BigInt(1000),
      toBlock: "latest",
    });

    console.log(`🔍 Recent 1000 blocks contain ${logs.length} events`);
    
    if (logs.length > 0) {
      console.log("📋 Most recent events:");
      logs.slice(-5).forEach((log, i) => {
        console.log(`  ${i + 1}. Block ${log.blockNumber}: ${log.args?.player} scored ${log.args?.score}`);
      });
    }

  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}