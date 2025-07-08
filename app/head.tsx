export default function Head() {
  // change this one line if you ever move to a custom domain
  const PUBLIC_URL = "https://fc-pet-the-cat.vercel.app";

  const embed = {
    version: "1",
    imageUrl: `${PUBLIC_URL}/cat-og.png`,
    button: {
      title: "Play",
      action: {
        type: "launch_frame",
        name: "Tap‑the‑Cat",
        url: PUBLIC_URL,
        splashImageUrl: `${PUBLIC_URL}/cat-icon.png`,
        splashBackgroundColor: "#ffb703"
      }
    }
  };

  return (
    <>
      <title>Tap‑the‑Cat</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {/* Warpcast / Farcaster mini‑app tags */}
      <meta name="fc:miniapp" content={JSON.stringify(embed)} />
      <meta name="fc:frame"  content={JSON.stringify(embed)} />
    </>
  );
}
