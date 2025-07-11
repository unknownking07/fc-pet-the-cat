import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";

const contractAddress = "0xE3DcD541fce641264299a7F27Af5b3DeBaaD2d8f";

export async function getLeaderboard(): Promise<
  { address: string; score: bigint }[]
> {
  const client = createPublicClient({
    chain: base,
    transport: http("https://base-mainnet.g.alchemy.com/v2/yKZCAarfw64JvLWyySYJH"),
  });

  const logs = await client.getLogs({
    address: contractAddress,
    event: parseAbiItem(
      "event ScoreSubmitted(address indexed player, uint256 score)"
    ),
    fromBlock: BigInt("20000000"),
    toBlock: "latest",
  });

  const scores = new Map<string, bigint>();
  for (const log of logs) {
    const { player, score } = log.args as {
      player: `0x${string}`;
      score: bigint;
    };
    const prev = scores.get(player);
    if (!prev || score > prev) {
      scores.set(player, score);
    }
  }

  return [...scores.entries()]
    .map(([address, score]) => ({ address, score }))
    .sort((a, b) => Number(b.score - a.score))
    .slice(0, 10); // ✅ Limit to top 10
}
