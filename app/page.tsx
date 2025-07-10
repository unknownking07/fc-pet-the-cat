"use client";
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { submitScoreToChain, isWalletConnected, connectWallet, getUserAddress } from "@/lib/submitScore";
import { getLeaderboard } from "@/lib/getLeaderboard";

type LeaderboardEntry = {
  address: string;
  score: bigint;
};

export default function Home() {
  const GAME_LENGTH = 10;
  
  // Game state
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTime] = useState(GAME_LENGTH);
  const [isRunning, setRun] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  
  // Blockchain state
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Initialize Farcaster SDK
  useEffect(() => {
    sdk.actions.ready().catch(console.error);
  }, []);

  // Check wallet connection on mount
  useEffect(() => {
    const checkWallet = async () => {
      try {
        const connected = await isWalletConnected();
        setWalletConnected(connected);
        
        if (connected) {
          // Get the user's Farcaster address
          const address = await getUserAddress();
          if (address) {
            setUserAddress(address);
          }
        }
      } catch (error) {
        console.error("Error checking Farcaster wallet:", error);
      }
    };
    checkWallet();
  }, []);

  // Load leaderboard on mount
  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };
    loadLeaderboard();
  }, []);

  // Game timer logic
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

  // Handle score submission when game ends
  useEffect(() => {
    if (gameEnded && !scoreSubmitted && taps > 0 && walletConnected) {
      handleScoreSubmission();
    }
  }, [gameEnded, scoreSubmitted, taps, walletConnected]);

  const handleConnectWallet = async () => {
    if (isConnecting) return;

    setIsConnecting(true);
    try {
      const accounts = await connectWallet();
      if (accounts && accounts.length > 0) {
        setWalletConnected(true);
        setUserAddress(accounts[0]);
        console.log("Farcaster wallet connected:", accounts[0]);
      }
    } catch (error: any) {
      console.error("Failed to connect Farcaster wallet:", error);
      setSubmitError(error.message || "Failed to connect Farcaster wallet");
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

  const handleScoreSubmission = async () => {
    if (isSubmitting || scoreSubmitted) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("Submitting score:", taps);
      const txHash = await submitScoreToChain(taps);
      console.log("Transaction hash:", txHash);
      
      setScoreSubmitted(true);
      
      // Refresh leaderboard after successful submission
      const updatedLeaderboard = await getLeaderboard();
      setLeaderboard(updatedLeaderboard);
      
    } catch (error: any) {
      console.error("Failed to submit score:", error);
      setSubmitError(error.message || "Failed to submit score");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTap = () => {
    if (timeLeft <= 0) return;
    
    if (!isRunning) {
      setRun(true);
    }
    
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

  const handleShare = async () => {
    const message = `😸 I petted the cat ${taps} times in ${GAME_LENGTH} seconds! Try it yourself: https://farcaster.xyz/miniapps/1s5lW72LNk14/tap-the-cat`;
    try {
      await sdk.actions.composeCast({ text: message });
    } catch (err) {
      console.error("Failed to share score", err);
    }
  };

  const refreshLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error("Error refreshing leaderboard:", error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-full min-h-screen gap-6 bg-violet-500 px-4 py-8">
      {/* CAT IMAGE */}
      <img
        src="/cat.png"
        alt="Brown cat"
        className={`w-40 h-40 rounded-2xl shadow-lg select-none transition-transform ${
          timeLeft === 0 ? "grayscale cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"
        }`}
        onClick={handleTap}
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
      <div className="text-center">
        <p className="text-lg font-retro text-white">
          Time left: <span className="font-bold text-yellow-300">{timeLeft}s</span>
        </p>
        <p className="text-lg font-retro text-yellow-300">
          You've petted the cat <span className="font-bold text-white">{taps}</span> times
        </p>
      </div>

      {/* WALLET CONNECTION */}
      <div className="w-full max-w-md">
        {!walletConnected ? (
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className={`w-full font-retro px-4 py-3 text-sm rounded-full shadow-lg transition ${
              isConnecting
                ? "bg-gray-400 cursor-not-allowed text-gray-600"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isConnecting ? "Connecting..." : "🔗 Connect Farcaster Wallet"}
          </button>
        ) : (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-center">
            <p className="text-sm text-green-200 mb-2">
              ✅ Farcaster Wallet Connected
            </p>
            <p className="text-xs text-green-300 font-mono">
              {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
            </p>
            <button
              onClick={handleDisconnectWallet}
              className="mt-2 text-xs text-green-300 hover:text-green-100 underline"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* WALLET STATUS */}
      {!walletConnected && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-center max-w-md">
          <p className="text-sm text-yellow-200">
            💡 Connect your Farcaster wallet to save scores to the blockchain leaderboard!
          </p>
        </div>
      )}

      {/* SCORE SUBMISSION STATUS */}
      {gameEnded && walletConnected && (
        <div className="text-center">
          {isSubmitting && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3">
              <p className="text-sm text-blue-200">
                🔄 Submitting your score to the blockchain...
              </p>
            </div>
          )}
          
          {scoreSubmitted && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
              <p className="text-sm text-green-200">
                ✅ Score successfully submitted to the blockchain!
              </p>
            </div>
          )}
          
          {submitError && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
              <p className="text-sm text-red-200">
                ❌ {submitError}
              </p>
              <button
                onClick={handleScoreSubmission}
                className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
              >
                Retry
              </button>
            </div>
          )}
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
          <div className="text-center py-4">
            <p className="text-sm text-white/60">Loading leaderboard...</p>
          </div>
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
          <div className="text-center py-4">
            <p className="text-sm text-white/60">No scores yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* CREDITS */}
      <p className="text-sm text-white/80 mt-4">
        Built by <span className="font-semibold">@unknownking</span>
      </p>
    </main>
  );
}