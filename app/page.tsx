"use client";

import { useEffect, useRef, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { getLeaderboard } from "@/lib/getLeaderboard";
import { submitScoreToChain } from "@/lib/submitScore";
import confetti from "canvas-confetti";
import Image from "next/image";

export default function Home() {
  const GAME_LENGTH = 10;
  const [visibleTime, setVisibleTime] = useState(GAME_LENGTH);
  const [visibleTaps, setVisibleTaps] = useState(0);
  const [isRunning, setRun] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [leaderboard, setLeaderboard] = useState<
    { address: string; score: bigint; fid?: number }[]
  >([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const timeRef = useRef(GAME_LENGTH);
  const tapsRef = useRef(0);

  // Notify Warpcast
  useEffect(() => {
    sdk.actions.ready().catch(console.error);
  }, []);

  // Detect wallet
  useEffect(() => {
    async function checkWallet() {
      try {
        const accounts = await sdk.wallet.ethProvider.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
        }
      } catch (err) {
        console.error("Wallet not connected", err);
      }
    }
    checkWallet();
  }, []);

  // Load leaderboard
  useEffect(() => {
    getLeaderboard().then(setLeaderboard).catch(console.error);
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      if (timeRef.current > 0) {
        timeRef.current -= 1;
        setVisibleTime(timeRef.current);
      } else {
        clearInterval(intervalId);
        setRun(false);

        if (!scoreSubmitted && tapsRef.current > 0) {
          submitScoreToChain(tapsRef.current).then(() => confetti());
          setScoreSubmitted(true);
          getLeaderboard().then(setLeaderboard).catch(console.error);
        }
      }
    };

    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning]);

  const handleTap = () => {
    if (visibleTime === 0 || scoreSubmitted) return;

    if (!isRunning) {
      timeRef.current = GAME_LENGTH;
      setRun(true);
    }

    if (timeRef.current > 0) {
      tapsRef.current += 1;
      setVisibleTaps(tapsRef.current);
    }
  };

  const resetGame = () => {
    timeRef.current = GAME_LENGTH;
    tapsRef.current = 0;
    setVisibleTime(GAME_LENGTH);
    setVisibleTaps(0);
    setRun(false);
    setScoreSubmitted(false);
    setShowLeaderboard(false);
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
      <div className="bg-white/90 p-4 rounded-xl shadow">
        <Image
          src="/cat.png"
          alt="Brown cat"
          width={160}
          height={160}
          className="rounded-2xl shadow-lg select-none"
          onClick={handleTap}
          style={{ cursor: visibleTime === 0 ? "not-allowed" : "pointer" }}
        />
      </div>

      {/* PET BUTTON */}
      <button
        onClick={handleTap}
        disabled={visibleTime === 0}
        className={`px-6 py-3 text-xl font-retro font-bold rounded-full shadow-lg transition active:scale-95 ${
          visibleTime === 0
            ? "bg-gray-400 cursor-not-allowed text-black"
            : "bg-yellow-400 hover:bg-yellow-300 text-black"
        }`}
      >
        Pet me 😸
      </button>

      {/* TIMER + SCORE */}
      <div className="bg-white/90 px-4 py-2 rounded-lg text-center text-black">
        <p className="text-lg font-medium">
          Time left: <span className="font-bold">{visibleTime}s</span>
        </p>
        <p className="text-lg font-medium">
          You’ve petted the cat{" "}
          <span className="font-bold">{visibleTaps}</span> times
        </p>
      </div>

      {/* SHARE + RESTART + TOGGLE LEADERBOARD */}
      {visibleTime === 0 && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={async () => {
              const message = `😸 I petted the cat ${visibleTaps} times in ${GAME_LENGTH} seconds! Try it yourself: https://farcaster.xyz/miniapps/1s5lW72LNk14/tap-the-cat`;
              try {
                await sdk.actions.composeCast({ text: message });
              } catch (err) {
                console.error("Failed to share score", err);
              }
            }}
            className="px-4 py-2 bg-white text-black font-semibold rounded-full shadow hover:bg-gray-100 transition"
          >
            Share Score
          </button>

          <button
            onClick={resetGame}
            className="px-4 py-2 bg-white text-black font-semibold rounded-full shadow hover:bg-gray-100 transition"
          >
            Play again
          </button>

          <button
            onClick={() => setShowLeaderboard((prev) => !prev)}
            className="px-4 py-2 bg-violet-700 text-white font-semibold rounded-full shadow hover:bg-violet-600 transition"
          >
            {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
          </button>
        </div>
      )}

      {/* LEADERBOARD SECTION */}
      {showLeaderboard && leaderboard.length > 0 && (
        <div className="mt-8 bg-white/90 p-4 rounded-xl w-full max-w-md text-sm shadow-lg">
          <h2 className="text-lg font-retro mb-2 text-black">🏆 Leaderboard</h2>
          <ol className="space-y-2">
            {leaderboard.map((entry, i) => {
              const isYou =
                entry.address.toLowerCase() === userAddress.toLowerCase();
              const avatarUrl = entry.fid
                ? `https://client.warpcast.com/avatar/${entry.fid}`
                : "https://placekitten.com/40/40";

              return (
                <li
                  key={entry.address}
                  className={`flex items-center justify-between ${
                    isYou ? "font-bold text-violet-800" : "text-black"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src={avatarUrl}
                      width={24}
                      height={24}
                      alt="Avatar"
                      className="rounded-full"
                    />
                    <span>
                      {i + 1}. {entry.address.slice(0, 6)}...
                      {entry.address.slice(-4)}
                      {isYou && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 rounded px-1 ml-2">
                          YOU
                        </span>
                      )}
                    </span>
                  </div>
                  <span>{entry.score.toString()}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* CREDITS */}
      <p className="text-[10px] opacity-80 mt-6 font-mono text-black">
        Built by <span className="font-semibold">@unknownking</span>
      </p>
    </main>
  );
}
