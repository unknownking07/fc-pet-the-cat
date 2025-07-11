import { createWalletClient, custom, createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { sdk } from "@farcaster/miniapp-sdk";
import { abi } from "@/lib/abi";

const CONTRACT_ADDRESS = "0xE3DcD541fce641264299a7F27Af5b3DeBaaD2d8f";

// ✅ Submit the user's score to the chain and wait for confirmation
export async function submitScoreToChain(score: number) {
  try {
    console.log("🚀 Starting score submission for score:", score);
    
    const client = createWalletClient({
      chain: base,
      transport: custom(sdk.wallet.ethProvider),
    });

    // Create public client for waiting for transaction
    const publicClient = createPublicClient({
      chain: base,
      transport: http("https://base-mainnet.g.alchemy.com/v2/yKZCAarfw64JvLWyySYJH"),
    });

    const [account] = await client.getAddresses();
    console.log("📋 Using account:", account);

    // Submit transaction and get hash
    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: "submitScore",
      args: [BigInt(score)],
      account,
    });

    console.log("📤 Transaction submitted with hash:", txHash);
    console.log("🔗 View on BaseScan:", `https://basescan.org/tx/${txHash}`);

    // ✅ Wait for transaction to be confirmed
    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60_000, // 60 seconds timeout
    });

    console.log("✅ Transaction confirmed!");
    console.log("📊 Gas used:", receipt.gasUsed.toString());
    console.log("🎯 Block number:", receipt.blockNumber.toString());
    
    return receipt;
  } catch (err) {
    console.error("❌ Failed to submit score:", err);
    
    // Provide more specific error messages
    if (err instanceof Error) {
      if (err.message.includes("User rejected")) {
        throw new Error("Transaction was rejected by user");
      } else if (err.message.includes("insufficient funds")) {
        throw new Error("Insufficient funds for gas fees");
      } else if (err.message.includes("timeout")) {
        throw new Error("Transaction timeout - it may still be pending");
      }
    }
    
    throw err; // Re-throw so calling code can handle it
  }
}

// ✅ Check if wallet is connected
export async function isWalletConnected(): Promise<boolean> {
  try {
    const accounts = await sdk.wallet.ethProvider.request({
      method: "eth_accounts"
    });
    return accounts.length > 0;
  } catch  {
    return false;
  }
}

// ✅ Trigger wallet connect
export async function connectWallet(): Promise<string[]> {
  try {
    const accounts = await sdk.wallet.ethProvider.request({
      method: "eth_requestAccounts"
    });
    return [...accounts];
  } catch (error) {
    console.error("❌ Failed to connect wallet:", error);
    return [];
  }
}

// ✅ Get current connected wallet address
export async function getUserAddress(): Promise<string | null> {
  try {
    const accounts = await sdk.wallet.ethProvider.request({
      method: "eth_accounts"
    });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("❌ Failed to get user address:", error);
    return null;
  }
}

// ✅ Get current network info
export async function getNetworkInfo() {
  try {
    const chainId = await sdk.wallet.ethProvider.request({
      method: "eth_chainId"
    });
    
    const isCorrectNetwork = chainId === "0x2105"; // Base mainnet chain ID
    
    return {
      chainId,
      isCorrectNetwork,
      expectedChainId: "0x2105",
      networkName: isCorrectNetwork ? "Base" : "Unknown Network"
    };
  } catch (error) {
    console.error("❌ Failed to get network info:", error);
    return null;
  }
}

// ✅ Switch to Base network if needed
export async function switchToBase(): Promise<boolean> {
  try {
    await sdk.wallet.ethProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }], // Base mainnet
    });
    return true;
  } catch (error) {
    console.error("❌ Failed to switch network:", error);
    return false;
  }
}