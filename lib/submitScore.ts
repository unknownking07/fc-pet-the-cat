import { ethers, providers } from "ethers";
import { abi } from "./abi";
import { sdk } from "@farcaster/miniapp-sdk";

const CONTRACT_ADDRESS = "0xf64d1D8c1F6e8F0e0dFe676Af84f69cA3A3B0482";

export async function submitScoreToChain(score: number) {
  try {
    console.log("⏳ Waiting for SDK to be ready...");
    await sdk.actions.ready();
    console.log("✅ SDK ready");

    const ethProvider = sdk.wallet.ethProvider;

    if (!ethProvider) {
      console.error("🚫 No wallet provider found.");
      throw new Error(
        "Farcaster wallet not available. Please open this mini app inside Warpcast."
      );
    }

    const provider = new providers.Web3Provider(
      ethProvider as providers.ExternalProvider
    );
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    console.log("🔐 Connected signer:", address);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    if (typeof contract.submitScore !== "function") {
      console.error("🚫 submitScore() func
