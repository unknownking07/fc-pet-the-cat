"use client";
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { getLeaderboard } from "@/lib/getLeaderboard";
import { submitScoreToChain } from "@/lib/submitScore";
import confetti from "canvas-confetti";

export default function Home() {
  const GAME_LENGTH = 10;
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTime] = useState(GAME_LENGTH);
  const [isRunning, setRun] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ address: string; score: bigint }[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string>("");

  // Notify Warpcast
  useEffect(() => {
    sdk.actions.ready().catch(console.error);
  }, []);

  // Auto-connect wallet on load
  useEffect(() => {
    async function checkWallet() {
      try {
        const accounts = await sdk.wallet.ethProvider.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletConnected(true);
          setUserAddress(accounts[0]);
        }
      } catch (err) {
        console.error("Wallet not connected", err);
      }
    }
    checkWallet();
  }, []);

  // Fetch leaderboard initially
  useEffect(() => {
    getLeaderboard().then(setLeaderboard).catch(console.error);
  }, []);

  // Game loop and score submission
  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft === 0) {
      setRun(false);
      if (!scoreSubmitted && taps > 0) {
        submitScoreToChain(taps).then(() => {
          confetti(); // 🎉 Celebrate new score
        });
        setScoreSubmitted(true);
        getLeaderboard().then(setLeaderboard).catch(console.error);
      }
      return;
    }
    const id = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, timeLeft, taps, scoreSubmitted]);

  const handleTap = () => {
    if (!isRunning) setRun(true);
    if (timeLeft > 0) setTaps((n) => n + 1);
  };

  const resetGame = () => {
    setTaps(0);
    setTime(GAME_LENGTH);
    setRun(false);
    setScoreSubmitted(false);
  };

  return (
    <main
      className="flex flex-col items-center justify-center h-full min-h-screen gap-6 px-4 py-8"
      style={{
        backgroundImage: "url('/cat-bg.png')",
        backgroundSize: "cover",
        backgroundRepeat: "repeat",
      }}
    >
      {/* CAT IMAGE */}
      <div className="bg-white/80 p-4 rounded-xl shadow">
        <img
          src="/cat.png"
          alt="Brown cat"
          className="w-40 h-40 rounded-2xl shadow-lg select-none"
          onClick={handleTap}
          style={{ cursor: timeLeft === 0 ? "not-allowed" : "pointer" }}
        />
      </div>

      {/* PET BUTTON */}
      <button
        onClick={handleTap}
        disabled={timeLeft === 0}
        className={`px-6 py-3 text-xl font-bold rounded-full shadow-lg transition active:scale-95 ${
          timeLeft === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-yellow-400 hover:bg-yellow-300 text-black"
        }`}
      >
        Pet me 😸
      </button>

      {/* TIMER + SCORE */}
      <div className="bg-white/80 px-4 py-2 rounded-lg text-center">
        <p className="text-lg font-medium text-violet-700">
          Time left: <span className="font-bold">{timeLeft}s</span>
        </p>
        <p className="text-lg font-medium text-violet-700">
          You’ve petted the cat <span className="font-bold">{taps}</span> times
        </p>
      </div>

      {/* Share & Restart */}
      {timeLeft === 0 && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={async () => {
              const message = `😸 I petted the cat ${taps} times in ${GAME_LENGTH} seconds! Try it yourself: https://farcaster.xyz/miniapps/1s5lW72LNk14/tap-the-cat`;
              try {
                await sdk.actions.composeCast({ text: message });
              } catch (err) {
                console.error("Failed to share score", err);
              }
            }}
            className="px-4 py-2 bg-white text-violet-700 font-semibold rounded-full shadow hover:bg-gray-100 transition"
          >
            Share Score
          </button>

          <button
            onClick={resetGame}
            className="px-4 py-2 bg-white text-violet-700 font-semibold rounded-full shadow hover:bg-gray-100 transition"
          >
            Play again
          </button>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mt-8 bg-white/80 p-4 rounded-xl text-violet-800 w-full max-w-md text-sm shadow-lg">
          <h2 className="text-lg font-retro mb-2">🏆 Leaderboard</h2>
          <ol className="space-y-1">
            {leaderboard.map((entry, i) => {
              const isYou = entry.address.toLowerCase() === userAddress?.toLowerCase();
              return (
                <li
                  key={entry.address}
                  className={`flex justify-between ${
                    isYou ? "font-bold text-violet-950" : ""
                  }`}
                >
                  <span>
                    {i + 1}. {entry.address.slice(0, 6)}...{entry.address.slice(-4)}{" "}
                    {isYou && <span className="text-xs bg-yellow-200 text-yellow-800 rounded px-1 ml-2">YOU</span>}
                  </span>
                  <span>{entry.score.toString()}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Credits */}
      <p className="text-xs text-white/80 mt-6 font-mono">Built by @unknownking</p>
    </main>
  );
}
