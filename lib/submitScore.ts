"use client";
import { createWalletClient, custom } from "viem";
import { base } from "viem/chains";
import { abi } from "./abi";
import { sdk } from "@farcaster/miniapp-sdk";

const contractAddress = "0xE3DcD541fce641264299a7F27Af5b3DeBaaD2d8f";

export async function submitScoreToChain(score: number) {
  try {
    // Use Farcaster's wallet provider
    const provider = await sdk.wallet.createWalletClient({
      chain: base,
    });

    if (!provider) {
      throw new Error("Failed to create wallet client");
    }

    // Get the user's address from Farcaster
    const accounts = await provider.getAddresses();
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect your Farcaster wallet.");
    }

    const account = accounts[0];
    console.log("Using Farcaster account:", account);

    // Submit the transaction using Farcaster's wallet
    const txHash = await provider.writeContract({
      address: contractAddress,
      abi,
      functionName: "submitScore",
      args: [BigInt(score)],
      account,
    });

    console.log("✅ Score submitted via Farcaster wallet:", txHash);
    return txHash;
  } catch (err: any) {
    console.error("❌ Error submitting score via Farcaster:", err);
    
    // Handle specific error cases
    if (err.message?.includes("User rejected") || err.message?.includes("rejected")) {
      throw new Error("Transaction was rejected");
    } else if (err.message?.includes("insufficient funds")) {
      throw new Error("Insufficient funds for gas fees");
    } else if (err.message?.includes("No accounts")) {
      throw new Error("Please connect your Farcaster wallet");
    } else {
      throw new Error(`Failed to submit score: ${err.message}`);
    }
  }
}

// Check if Farcaster wallet is connected
export async function isWalletConnected(): Promise<boolean> {
  try {
    const provider = await sdk.wallet.createWalletClient({
      chain: base,
    });
    
    if (!provider) return false;
    
    const accounts = await provider.getAddresses();
    return accounts && accounts.length > 0;
  } catch {
    return false;
  }
}

// Connect Farcaster wallet
export async function connectWallet(): Promise<string[]> {
  try {
    const provider = await sdk.wallet.createWalletClient({
      chain: base,
    });

    if (!provider) {
      throw new Error("Failed to create Farcaster wallet client");
    }

    const accounts = await provider.getAddresses();
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No Farcaster accounts found");
    }

    return accounts;
  } catch (error: any) {
    throw new Error(`Failed to connect Farcaster wallet: ${error.message}`);
  }
}

// Get user's Farcaster address
export async function getUserAddress(): Promise<string | null> {
  try {
    const provider = await sdk.wallet.createWalletClient({
      chain: base,
    });
    
    if (!provider) return null;
    
    const accounts = await provider.getAddresses();
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch {
    return null;
  }
}