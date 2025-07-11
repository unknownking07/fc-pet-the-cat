"use client";

import { useEffect, useRef, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { getLeaderboard, getFullLeaderboard } from "@/lib/getLeaderboard";
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
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState(false);
  const [useFullHistory, setUseFullHistory] = useState(false);

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
          console.log("🔗 Wallet connected:", accounts[0]);
        }
      } catch (err) {
        console.error("❌ Wallet not connected", err);
      }
    }
    checkWallet();
  }, []);

  // Load leaderboard on mount
  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Function to load leaderboard (can switch between recent and full)
  const loadLeaderboard = async (forceFullHistory = false) => {
    setIsRefreshingLeaderboard(true);
    try {
      console.log("🔄 Loading leaderboard...");
      
      let newLeaderboard;
      if (forceFullHistory || useFullHistory) {
        console.log("📚 Using full history mode");
        newLeaderboard = await getFullLeaderboard();
      } else {
        console.log("⚡ Using recent blocks mode (faster)");
        newLeaderboard = await getLeaderboard(5000); // Last 5000 blocks
      }
      
      setLeaderboard(newLeaderboard);
      console.log("✅ Leaderboard loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load leaderboard:", error);
    } finally {
      setIsRefreshingLeaderboard(false);
    }
  };

  // Countdown logic
  useEffect(() => {
    if (!isRunning) return;

    const tick = async () => {
      if (timeRef.current > 0) {
        timeRef.current -= 1;
        setVisibleTime(timeRef.current);
      } else {
        clearInterval(intervalId);
        setRun(false);

        if (!scoreSubmitted && tapsRef.current > 0) {
          setIsSubmittingScore(true);
          setSubmitError(null);
          
          try {
            console.log("🚀 Submitting score to chain...");
            await submitScoreToChain(tapsRef.current);
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            setScoreSubmitted(true);
            
            console.log("🔄 Fetching updated leaderboard...");
            // Wait a bit for the transaction to be indexed
            setTimeout(async () => {
              await loadLeaderboard();
            }, 2000);
            
          } catch (error) {
            console.error("❌ Failed to submit score:", error);
            setSubmitError("Failed to submit score. Please try again.");
          } finally {
            setIsSubmittingScore(false);
          }
        }
      }
    };

    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning, scoreSubmitted]);

  const handleTap = () => {
    if (visibleTime === 0 || scoreSubmitted || isSubmittingScore) return;

    if (!isRunning) {
      timeRef.current = GAME_LENGTH;
      setRun(true);
      console.log("🎮 Game started!");
    }

    if (timeRef.current > 0) {
      tapsRef.current += 1;
      setVisibleTaps(tapsRef.current);
    }
  };

  const resetGame = () => {
    console.log("🔄 Resetting game...");
    timeRef.current = GAME_LENGTH;
    tapsRef.current = 0;
    setVisibleTime(GAME_LENGTH);
    setVisibleTaps(0);
    setRun(false);
    setScoreSubmitted(false);
    setShowLeaderboard(false);
    setSubmitError(null);
    setIsSubmittingScore(false);
  };

  const refreshLeaderboard = async () => {
    console.log("🔄 Manual refresh requested");
    await loadLeaderboard();
  };

  const toggleHistoryMode = () => {
    setUseFullHistory(!useFullHistory);
    console.log(`🔄 Switched to ${!useFullHistory ? 'full history' : 'recent blocks'} mode`);
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
          style={{ 
            cursor: (visibleTime === 0 || isSubmittingScore) ? "not-allowed" : "pointer",
            opacity: isSubmittingScore ? 0.7 : 1,
          }}
        />
      </div>

      {/* PET BUTTON */}
      <button
        onClick={handleTap}
        disabled={visibleTime === 0 || isSubmittingScore}
        className={`px-6 py-3 text-xl font-retro font-bold rounded-full shadow-lg transition active:scale-95 ${
          visibleTime === 0 || isSubmittingScore
            ? "bg-gray-400 cursor-not-allowed text-black"
            : "bg-yellow-400 hover:bg-yellow-300 text-black"
        }`}
      >
        {isSubmittingScore ? "Submitting..." : "Pet me 😸"}
      </button>

      {/* TIMER + SCORE */}
      <div className="bg-white/90 px-4 py-2 rounded-lg text-center text-black">
        <p className="text-lg font-medium">
          Time left: <span className="font-bold">{visibleTime}s</span>
        </p>
        <p className="text-lg font-medium">
          You've petted the cat{" "}
          <span className="font-bold">{visibleTaps}</span> times
        </p>
      </div>

      {/* LOADING STATE FOR SCORE SUBMISSION */}
      {isSubmittingScore && (
        <div className="bg-blue-100 px-4 py-2 rounded-lg text-center text-blue-700">
          <p className="text-sm">🚀 Submitting score to blockchain...</p>
          <p className="text-xs">Please wait for transaction confirmation</p>
        </div>
      )}

      {/* ERROR STATE */}
      {submitError && (
        <div className="bg-red-100 px-4 py-2 rounded-lg text-center text-red-700">
          <p className="text-sm">{submitError}</p>
          <button
            onClick={() => setSubmitError(null)}
            className="text-xs underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SHARE + RESTART + TOGGLE LEADERBOARD */}
      {visibleTime === 0 && !isSubmittingScore && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={async () => {
              const message = `😸 I petted the cat ${visibleTaps} times in ${GAME_LENGTH} seconds! Try it yourself: https://farcaster.xyz/miniapps/1s5lW72LNk14/tap-the-cat`;
              try {
                await sdk.actions.composeCast({ text: message });
              } catch (err) {
                console.error("❌ Failed to share score", err);
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

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setShowLeaderboard((prev) => !prev)}
              className="px-4 py-2 bg-violet-700 text-white font-semibold rounded-full shadow hover:bg-violet-600 transition"
            >
              {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
            </button>

            <button
              onClick={refreshLeaderboard}
              disabled={isRefreshingLeaderboard}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-full shadow hover:bg-green-500 transition disabled:opacity-50"
            >
              {isRefreshingLeaderboard ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={toggleHistoryMode}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full shadow hover:bg-blue-500 transition"
            >
              {useFullHistory ? "⚡ Fast Mode" : "📚 Full History"}
            </button>
          </div>
        </div>
      )}

      {/* LEADERBOARD SECTION */}
      {showLeaderboard && (
        <div className="mt-8 bg-white/90 p-4 rounded-xl w-full max-w-md text-sm shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-retro text-black">🏆 Leaderboard</h2>
            <div className="text-xs text-gray-500">
              {useFullHistory ? "📚 Full History" : "⚡ Recent Blocks"}
            </div>
          </div>
          
          {isRefreshingLeaderboard ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length > 0 ? (
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
                    className={`flex items-center justify-between p-2 rounded ${
                      isYou ? "font-bold text-violet-800 bg-violet-50" : "text-black"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                      </span>
                      <Image
                        src={avatarUrl}
                        width={24}
                        height={24}
                        alt="Avatar"
                        className="rounded-full"
                      />
                      <span className="text-sm">
                        {entry.address.slice(0, 6)}...
                        {entry.address.slice(-4)}
                        {isYou && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 rounded px-1 ml-2">
                            YOU
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-bold">{entry.score.toString()}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">No scores yet. Be the first to play!</p>
              <button
                onClick={() => loadLeaderboard(true)}
                className="text-xs text-blue-600 underline mt-2"
              >
                Try loading full history
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREDITS */}
      <p className="text-[10px] opacity-80 mt-6 font-mono text-black">
        Built by <span className="font-semibold">@unknownking</span>
      </p>
    </main>
  );
}