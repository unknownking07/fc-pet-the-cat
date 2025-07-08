"use client";
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export default function Home() {
  // ---- game state -----------------------------------------------------------
  const GAME_LENGTH = 10;               // seconds
  const [taps, setTaps]     = useState(0);
  const [timeLeft, setTime] = useState(GAME_LENGTH);
  const [isRunning, setRun] = useState(false);

  // Tell Warpcast we’re ready once the component mounts
  useEffect(() => {
    sdk.actions.ready().catch(console.error);
  }, []);

  // ---- countdown effect -----------------------------------------------------
  useEffect(() => {
    if (!isRunning) return;             // don’t tick until game starts
    if (timeLeft === 0) {               // time’s up → stop the game
      setRun(false);
      return;
    }

    const id = setInterval(() => setTime((t) => t - 1), 1_000);
    return () => clearInterval(id);     // cleanup on re‑render/unmount
  }, [isRunning, timeLeft]);

  // ---- handlers -------------------------------------------------------------
  const handleTap = () => {
    if (!isRunning) setRun(true);       // start timer on first tap
    if (timeLeft > 0) setTaps((n) => n + 1);
  };

  const resetGame = () => {
    setTaps(0);
    setTime(GAME_LENGTH);
    setRun(false);
  };

  // ---- UI -------------------------------------------------------------------
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-6 bg-violet-500">
      {/* CAT IMAGE */}
      <img
        src="/cat.png"
        alt="Brown cat"
        className="w-40 h-40 rounded-2xl shadow-lg select-none"
        onClick={handleTap}
        style={{ cursor: timeLeft === 0 ? "not-allowed" : "pointer" }}
      />

      {/* PET BUTTON */}
      <button
        onClick={handleTap}
        disabled={timeLeft === 0}
        className={`px-6 py-3 text-xl font-bold rounded-full shadow-lg transition active:scale-95
          ${timeLeft === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-yellow-400 hover:bg-yellow-300 text-black"}`}
      >
        Pet me 😸
      </button>

      {/* TIMER + SCORE */}
      <p className="text-lg font-medium text-white">
        Time left: <span className="font-bold">{timeLeft}s</span>
      </p>
      <p className="text-lg font-medium text-white">
        You’ve petted the cat <span className="font-bold">{taps}</span> times
      </p>

      {/* SHARE + RESTART BUTTONS */}
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

      {/* CREDITS */}
      <p className="text-sm text-white/80 mt-4">
        Built by <span className="font-semibold">@unknownking</span>
      </p>
    </main>
  );   // <-- closes return(...)

}      // <-- closes function
