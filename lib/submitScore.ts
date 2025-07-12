import { ethers, providers } from "ethers";
import { abi } from "./abi"; // ✅ Corrected import
import { sdk } from "@farcaster/miniapp-sdk";

const CONTRACT_ADDRESS = "0xf64d1D8c1F6e8F0e0dFe676Af84f69cA3A3B0482";

export async function submitScoreToChain(score: number) {
  try {
    console.log("⏳ Waiting for Warpcast SDK to be ready...");
    await sdk.actions.ready();

    if (!sdk.wallet.ethProvider) {
      throw new Error("Wallet provider not available.");
    }

    const provider = new providers.Web3Provider(
      sdk.wallet.ethProvider as providers.ExternalProvider
    );

    const signer = provider.getSigner();
    const address = await signer.getAddress();
    console.log("🔐 Using signer address:", address);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    console.log("📡 Calling submitScore(", score, ") on contract...");
    const tx = await contract.submitScore(score); // wallet popup triggers here

    console.log("⛓️ Tx submitted:", tx.hash);
    await tx.wait();
    console.log("✅ Tx confirmed:", tx.hash);
  } catch (err) {
    console.error("❌ submitScoreToChain error:", err);
    throw new Error("Score submission failed.");
  }
}
