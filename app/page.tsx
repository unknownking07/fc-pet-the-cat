"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  submitScoreToChain,
  isWalletConnected,
  connectWallet,
  getUserAddress,
} from "@/lib/submitScore";
import { getLeaderboard } from "@/lib/getLeaderboard";

type LeaderboardEntry = {
  address: string;
  score: bigint;
};

// 👇 helper to detect Warpcast environment
function isWarpcast() {
  return typeof navigator !== "undefined" && navigator.userAgent.includes("Warpcast");
}

export default function Home() {
  const GAME_LENGTH = 10;

  const [taps, setTaps] = useState(0);
  const [timeLeft, setTime] = useState(GAME_LENGTH);
  const [isRunning, setRun] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Ready SDK
  useEffect(() => {
    sdk.actions.ready().catch(console.error);
  }, []);

  // Check wallet on load
  useEffect(() => {
    const check = async () => {
      if (!isWarpcast()) return;
      try {
        const connected = await isWalletConnected();
        setWalletConnected(connected);
        if (connected) {
          const addr = await getUserAddress();
          if (addr) setUserAddress(addr);
        }
      } catch (e) {
        console.error("Wallet check failed:", e);
      }
    };
    check();
  }, []);

  // Leaderboard on load
  useEffect(() => {
    const load = async () => {
      setIsLoadingLeaderboard(true);
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };
    load();
  }, []);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft === 0) {
      setRun(false);
      setGameEnded(true);
      return;
    }
    const id = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, timeLeft]);

  // Auto-submit
  useEffect(() => {
    if (gameEnded && !scoreSubmitted && taps > 0 && walletConnected) {
      handleScoreSubmission();
    }
  }, [gameEnded, scoreSubmitted, taps, walletConnected]);

  // Tap
  const handleTap = () => {
    if (timeLeft <= 0) return;
    if (!isRunning) setRun(true);
    setTaps((n) => n + 1);
  };

  const resetGame = () => {
    setTaps(0);
    setTime(GAME_LENGTH);
    setRun(false);
    setGameEnded(false);
    setScoreSubmitted(false);
    setIsSubmitting(false);
    setSubmitError(null);
  };

  const handleConnectWallet = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const accounts = await connectWallet();
      if (accounts.length > 0) {
        setWalletConnected(true);
        setUserAddress(accounts[0]);
      }
    } catch (err) {
      console.error("Connect error:", err);
      alert("⚠️ Please open this app in Warpcast to connect your wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setUserAddress(null);
    setScoreSubmitted(false);
    setSubmitError(null);
  };

  const handleScoreSubmission = useCallback(async () => {
    if (isSubmitting || scoreSubmitted) return;
    setIsSubmitting(true);
    try {
      await submitScoreToChain(taps);
      setScoreSubmitted(true);
      const lb = await getLeaderboard();
      setLeaderboard(lb);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error submitting score";
      console.error("Submit error:", err);
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, scoreSubmitted, taps]);

  const handleShare = async () => {
    const msg = `😸 I petted the cat ${taps} times in ${GAME_LENGTH} seconds! Try it here: https://farcaster.xyz/miniapps/1s5lW72LNk14/tap-the-cat`;
    try {
      await sdk.actions.composeCast({ text: msg });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const refreshLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error("Leaderboard refresh error:", error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-full min-h-screen gap-6 bg-violet-500 px-4 py-8">
      {/* CAT IMAGE */}
      <Image
        src="/cat.png"
        alt="Brown cat"
        width={160}
        height={160}
        className={`w-40 h-40 rounded-2xl shadow-lg select-none transition-transform ${
          timeLeft === 0 ? "grayscale cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"
        }`}
        onClick={handleTap}
        priority
      />

      {/* PET BUTTON */}
      <button
        onClick={handleTap}
        disabled={timeLeft === 0}
        className={`font-retro px-6 py-3 text-xl rounded-full shadow-lg transition active:scale-95 ${
          timeLeft === 0
            ? "bg-gray-400 cursor-not-allowed text-gray-600"
            : "bg-yellow-400 hover:bg-yellow-300 text-black"
        }`}
      >
        {timeLeft === 0 ? "Game Over!" : "Pet me 😸"}
      </button>

      {/* GAME STATUS */}
      <div className="text-center text-white font-retro">
        <p>
          Time left: <span className="font-bold text-yellow-300">{timeLeft}s</span>
        </p>
        <p>
          You’ve petted the cat <span className="font-bold">{taps}</span> times
        </p>
      </div>

      {/* WALLET CONNECTION */}
      {isWarpcast() && !walletConnected && (
        <button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="font-retro w-full max-w-md px-4 py-3 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition"
        >
          {isConnecting ? "Connecting..." : "🔗 Connect Farcaster Wallet"}
        </button>
      )}

      {/* WALLET INFO */}
      {walletConnected && userAddress && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-center max-w-md">
          <p className="text-sm text-green-200">✅ Wallet Connected</p>
          <p className="text-xs font-mono text-green-300">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</p>
          <button
            onClick={handleDisconnectWallet}
            className="mt-1 text-xs text-green-200 underline hover:text-green-100"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* GAME END ACTIONS */}
      {gameEnded && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleShare}
            className="font-retro px-4 py-2 bg-white text-violet-700 font-semibold rounded-full shadow hover:bg-gray-100 transition"
          >
            Share Score
          </button>
          <button
            onClick={resetGame}
            className="font-retro px-4 py-2 bg-white text-violet-700 font-semibold rounded-full shadow hover:bg-gray-100 transition"
          >
            Play Again
          </button>
        </div>
      )}

      {/* SUBMISSION STATUS */}
      {gameEnded && walletConnected && (
        <div className="text-center">
          {isSubmitting && <p className="text-blue-200 text-sm">⏳ Submitting your score...</p>}
          {scoreSubmitted && <p className="text-green-300 text-sm">✅ Score saved!</p>}
          {submitError && (
            <div className="text-red-300 text-sm">
              ❌ {submitError}
              <br />
              <button
                onClick={handleScoreSubmission}
                className="underline text-xs hover:text-red-100"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* LEADERBOARD */}
      <div className="mt-8 bg-white/10 p-4 rounded-xl text-white w-full max-w-md">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-retro">🏆 Leaderboard</h2>
          <button
            onClick={refreshLeaderboard}
            disabled={isLoadingLeaderboard}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition disabled:opacity-50"
          >
            {isLoadingLeaderboard ? "..." : "↻"}
          </button>
        </div>

        {isLoadingLeaderboard ? (
          <p className="text-center text-sm text-white/60">Loading leaderboard...</p>
        ) : leaderboard.length > 0 ? (
          <ol className="space-y-1 font-mono text-sm">
            {leaderboard.map((entry, i) => (
              <li key={entry.address} className="flex justify-between">
                <span>
                  {i + 1}. {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                </span>
                <span className="font-bold">{entry.score.toString()}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-center text-sm text-white/60">No scores yet. Be the first!</p>
        )}
      </div>

      {/* FOOTER */}
      <p className="text-sm text-white/80 mt-4">
        Built by <span className="font-semibold">@unknownking</span>
      </p>
    </main>
  );
}
