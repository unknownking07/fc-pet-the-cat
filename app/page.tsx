"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { getLeaderboard, getFullLeaderboard } from "@/lib/getLeaderboard";
import { submitScoreToChain } from "@/lib/submitScore";
import confetti from "canvas-confetti";
import Image from "next/image";
import { useSpring, animated } from "@react-spring/web";

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
  const [catBop, setCatBop] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const catSpring = useSpring({
    transform: catBop ? "scale(1.15) rotate(-7deg)" : "scale(1) rotate(0deg)",
    config: { tension: 300, friction: 10 },
  });

  const timeRef = useRef(GAME_LENGTH);
  const tapsRef = useRef(0);

  // Notify Warpcast
  useEffect(() => {
    sdk.actions.ready().catch(console.error);
  }, []);

  // Detect wallet and auto-connect if possible
  useEffect(() => {
    async function checkWallet() {
      try {
        // Try to get accounts
        const accounts = await sdk.wallet.ethProvider.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setUserAddress(accounts[0].toLowerCase());
          setSignedIn(true);
        } else {
          setSignedIn(false);
        }
      } catch {
        setSignedIn(false);
      }
    }
    checkWallet();
  }, []);

  // Leaderboard loading
  const loadLeaderboard = useCallback(
    async (forceFullHistory = false, retryCount = 0) => {
      setIsRefreshingLeaderboard(true);
      try {
        let newLeaderboard;
        if (forceFullHistory || useFullHistory) {
          newLeaderboard = await getFullLeaderboard();
        } else {
          newLeaderboard = await getLeaderboard(10000);
        }
        setLeaderboard(newLeaderboard);
      } catch {
        if (retryCount === 0 && !forceFullHistory) {
          setTimeout(() => loadLeaderboard(true, 1), 2000);
        }
      } finally {
        setIsRefreshingLeaderboard(false);
      }
    },
    [useFullHistory]
  );

  // Load leaderboard only when needed
  useEffect(() => {
    if (showLeaderboard) loadLeaderboard();
  }, [showLeaderboard, loadLeaderboard]);

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
        setReadyToSubmit(true);
      }
    };

    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning]);

  // Cat tap animation
  const handleTap = () => {
    if (visibleTime === 0 || scoreSubmitted || isSubmittingScore) return;
    if (!isRunning) {
      timeRef.current = GAME_LENGTH;
      setRun(true);
    }
    if (timeRef.current > 0) {
      tapsRef.current += 1;
      setVisibleTaps(tapsRef.current);
      setCatBop(true);
      setTimeout(() => setCatBop(false), 150);
    }
  };

  // Sign in and submit score
  const handleSignInAndSubmit = async () => {
    setIsSubmittingScore(true);
    setSubmitError(null);
    try {
      // Request wallet connection if not signed in
      if (!signedIn) {
        await sdk.wallet.connect();
        // Re-check address
        const accounts = await sdk.wallet.ethProvider.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setUserAddress(accounts[0].toLowerCase());
          setSignedIn(true);
        } else {
          setSubmitError("Wallet connection failed.");
          setIsSubmittingScore(false);
          return;
        }
      }
      // Submit score
      await submitScoreToChain(tapsRef.current);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setScoreSubmitted(true);
      setShowLeaderboard(true);
      setTimeout(() => loadLeaderboard(), 3000);
    } catch {
      setSubmitError("Failed to submit score. Please try again.");
    } finally {
      setIsSubmittingScore(false);
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
    setSubmitError(null);
    setIsSubmittingScore(false);
    setReadyToSubmit(false);
  };

  const refreshLeaderboard = async () => {
    await loadLeaderboard(true);
  };

  return (
    <main
      className="flex flex-col items-center justify-center h-full min-h-screen gap-6 px-4 py-8 bg-gradient-to-br from-yellow-50 to-violet-100"
      style={{
        backgroundImage: "url('/cat-bg.png')",
        backgroundSize: "cover",
        backgroundRepeat: "repeat",
      }}
    >
      {/* CAT IMAGE with animation */}
      <div className="bg-white/90 p-4 rounded-xl shadow">
        <animated.div style={catSpring}>
          <Image
            src="/cat.png"
            alt="Brown cat"
            width={160}
            height={160}
            className="rounded-2xl shadow-lg select-none"
            onClick={handleTap}
            style={{
              cursor:
                visibleTime === 0 || isSubmittingScore
                  ? "not-allowed"
                  : "pointer",
              opacity: isSubmittingScore ? 0.7 : 1,
              userSelect: "none",
            }}
          />
        </animated.div>
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
          You&apos;ve petted the cat{" "}
          <span className="font-bold">{visibleTaps}</span> times
        </p>
      </div>

      {/* SUBMITTING LOADER */}
      {isSubmittingScore && (
        <div className="bg-blue-100 px-4 py-2 rounded-lg text-center text-blue-700">
          <p className="text-sm">🚀 Submitting score to blockchain...</p>
          <p className="text-xs">Please wait for transaction confirmation</p>
        </div>
      )}

      {/* ERROR */}
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

      {/* GAME OVER ACTIONS */}
      {visibleTime === 0 && !isSubmittingScore && !scoreSubmitted && (
        <div className="flex flex-col items-center gap-3">
          {readyToSubmit && (
            <button
              onClick={handleSignInAndSubmit}
              className="px-6 py-3 text-lg font-bold rounded-full shadow-lg bg-violet-700 text-white hover:bg-violet-600 transition"
              disabled={isSubmittingScore}
            >
              {signedIn ? "Submit Score" : "Sign In & Submit Score"}
            </button>
          )}
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-white text-black font-semibold rounded-full shadow hover:bg-gray-100 transition"
          >
            Play again
          </button>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {scoreSubmitted && !isSubmittingScore && (
        <div className="bg-green-100 px-4 py-2 rounded-lg text-center text-green-700">
          <p className="text-sm">✅ Score submitted successfully!</p>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="mt-2 px-4 py-2 bg-violet-700 text-white rounded-full shadow hover:bg-violet-600 transition"
          >
            Show Leaderboard
          </button>
        </div>
      )}

      {/* LEADERBOARD */}
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
                      isYou
                        ? "font-bold text-violet-800 bg-violet-50"
                        : "text-black"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {i === 0
                          ? "🥇"
                          : i === 1
                          ? "🥈"
                          : i === 2
                          ? "🥉"
                          : `${i + 1}.`}
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
              <p className="text-gray-600">
                {scoreSubmitted
                  ? "Your score is being processed..."
                  : "No scores yet. Be the first to play!"}
              </p>
              <button
                onClick={refreshLeaderboard}
                className="text-xs text-blue-600 underline mt-2"
              >
                Force refresh with full history
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
