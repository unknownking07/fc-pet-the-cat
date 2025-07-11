import { createWalletClient, custom } from "viem";
import { base } from "viem/chains";
import { sdk } from "@farcaster/miniapp-sdk";
import { abi } from "@/lib/abi";

const CONTRACT_ADDRESS = "0xE3DcD541fce641264299a7F27Af5b3DeBaaD2d8f";

// ✅ Submit the user's score to the chain
export async function submitScoreToChain(score: number) {
  try {
    const client = createWalletClient({
      chain: base,
      transport: custom(sdk.wallet.ethProvider),
    });

    const [account] = await client.getAddresses();

    await client.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "submitScore",
      args: [BigInt(score)],
      account,
    });

    console.log("✅ Score submitted to chain!");
  } catch (err) {
    console.error("❌ Failed to submit score:", err);
  }
}

// ✅ Check if wallet is connected
export async function isWalletConnected(): Promise<boolean> {
  try {
    const accounts = await sdk.wallet.ethProvider.request({
      method: "eth_accounts"
    });
    return accounts.length > 0;
  } catch (error) {
    return false;
  }
}

// ✅ Trigger wallet connect
export async function connectWallet(): Promise<string[]> {
  const accounts = await sdk.wallet.ethProvider.request({
    method: "eth_accounts"
  });
  return [...accounts];
}

// ✅ Get current connected wallet address
export async function getUserAddress(): Promise<string | null> {
  const accounts = await sdk.wallet.ethProvider.request({
    method: "eth_accounts"
  });
  return accounts.length > 0 ? accounts[0] : null;
}
