import { ethers } from "ethers";
import { abi } from "./abi";
import { sdk } from "@farcaster/miniapp-sdk";

const CONTRACT_ADDRESS = "0xf64d1D8c1F6e8F0e0dFe676Af84f69cA3A3B0482"; // your deployed Base contract

export async function submitScoreToChain(score: number) {
  try {
    // Get the connected wallet from Farcaster Miniapp SDK
    const provider = new ethers.providers.Web3Provider(
      sdk.wallet.ethProvider as any
    );

    const signer = provider.getSigner();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    console.log("📡 Submitting score to contract...");

    const tx = await contract.submitScore(score); // replace with actual method
    console.log("⛓️ Tx submitted:", tx.hash);

    await tx.wait();
    console.log("✅ Tx confirmed:", tx.hash);
  } catch (err) {
    console.error("❌ submitScoreToChain error:", err);
    throw new Error("Score submission failed.");
  }
}
