import { ethers, providers } from "ethers";
import { abi } from "./abi";
import { sdk } from "@farcaster/miniapp-sdk";

const CONTRACT_ADDRESS = "0xf64d1D8c1F6e8F0e0dFe676Af84f69cA3A3B0482";

export async function submitScoreToChain(score: number) {
  try {
    const provider = new providers.Web3Provider(
      sdk.wallet.ethProvider as providers.ExternalProvider
    );

    const signer = provider.getSigner();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    console.log("📡 Submitting score to contract...");
    const tx = await contract.submitScore(score);
    console.log("⛓️ Tx submitted:", tx.hash);

    await tx.wait();
    console.log("✅ Tx confirmed:", tx.hash);
  } catch (err) {
    console.error("❌ submitScoreToChain error:", err);
    throw new Error("Score submission failed.");
  }
}
