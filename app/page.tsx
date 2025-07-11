"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  submitScoreToChain,
  connectWallet,
  isWalletConnected,
  getUserAddress,
} from "@/lib/submitScore";
import { getLeaderboard } from "@/lib/getLeaderboard";

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

  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ address: string; score: bigint }[]>([]);

  // Tell Warpcast we're ready
  useEffect(() => {
    sdk.actions.ready().catch(console.error);
  }, []);

  // Auto-connect wallet in Warpcast
  useEffect(() => {
    const connect = async () => {
      if (!isWarpcast()) return;

      const connected = await isWalletConnected();
      setWalletConnected(connected);

      if (!connected) {
        try {
          const accounts = await connectWallet();
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
            setWalletConnected(true);
          }
        } catch (err) {
          console.warn("Wallet connection failed", err);
        }
      } else {
        const addr = await getUserAddress();
        if (addr) setUserAddress(addr);
      }
    };

    connect();
  }, []);

  // Game logic
  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft === 0) {
      setRun(false);
      setGameEnded(true);
      return;
    }

    const timer = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // Submit score when game ends
  useEffect(() => {
    const sendScore = async () => {
      if (!walletConnected || scoreSubmitted || taps === 0) return;

      await submitScoreToChain(taps);
      setScoreSubmitted(true);
      const scores = await getLeaderboard();
      setLeaderboard(scores);
    };

    if (gameEnded) {
      sendScore();
    }
  }, [gameEnded]);

  // Fetch leaderboard initially
  useEffect(() => {
    getLeaderboard().then(setLeaderboard).catch(console.error);
  }, []);

  const handleTap = () => {
    if (!isRunning) setRun(true);
    if (timeLeft > 0) setTaps((n) => n + 1);
  };

  const resetGame = () => {
    setTaps(0);
    setTime(GAME_LENGTH);
    setRun(false);
    setGameEnded(false);
    setScoreSubmitted(false);
  };

  const handleShare = async () => {
    const message = `😸 I petted the cat ${taps} times in ${GAME_LENGTH} seconds! Try it: https://farcaster.xyz/miniapps/1s5lW72LNk14/tap-the-cat`;
    try {
      await sdk.actions.composeCast({ text: message });
    } catch (err) {
      console.error("Failed to share", err);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 bg-violet-500 px-4 py-8">
      <Image
        src="/cat.png"
        alt="Brown cat"
        width={160}
        height={160}
        onClick={handleTap}
        className="w-40 h-40 rounded-2xl shadow-lg cursor-pointer hover:scale-105 transition"
      />

      <button
        onClick={handleTap}
        disabled={timeLeft === 0}
        className={`px-6 py-3 text-xl font-retro font-bold rounded-full shadow-lg transition active:scale-95 ${
          timeLeft === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-400 hover:bg-yellow-300 text-black"
        }`}
      >
        Pet me 😸
      </button>

      <p className="text-lg font-retro text-white">
        Time left: <span className="font-bold">{timeLeft}s</span>
      </p>
      <p className="text-lg font-retro text-white">
        You’ve petted the cat <span className="font-bold">{taps}</span> times
      </p>

      {gameEnded && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleShare}
            className="px-4 py-2 font-retro bg-white text-violet-700 rounded-full shadow hover:bg-gray-100"
          >
            Share Score
          </button>
          <button
            onClick={resetGame}
            className="px-4 py-2 font-retro bg-white text-violet-700 rounded-full shadow hover:bg-gray-100"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Leaderboard */}
      <div className="mt-8 bg-white/10 p-4 rounded-xl text-white w-full max-w-md text-sm">
        <h2 className="text-lg font-retro mb-2">🏆 Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-white/70">No scores yet. Be the first!</p>
        ) : (
          <ol className="space-y-1">
            {leaderboard.map((entry, i) => (
              <li key={entry.address}>
                {i + 1}. {entry.address.slice(0, 6)}...{entry.address.slice(-4)} —{" "}
                {entry.score.toString()}
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="text-sm text-white/80 mt-4">
        Built by <span className="font-semibold">@unknownking</span>
      </p>
    </main>
  );
}
