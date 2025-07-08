export default function Head() {
  const embed = {
    version: "1",
    imageUrl: "https://YOUR_DOMAIN/cat-og.png",
    button: {
      title: "Play",
      action: {
        type: "launch_frame",
        name: "Tap-the-Cat",
        url: "https://YOUR_DOMAIN",
        splashImageUrl: "https://YOUR_DOMAIN/cat-icon.png",
        splashBackgroundColor: "#ffb703"
      }
    }
  };

  return (
    <>
      <title>Tap‑the‑Cat</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {/* Mini‑App meta tags for Warpcast */}
      <meta name="fc:miniapp" content={JSON.stringify(embed)} />
      <meta name="fc:frame"   content={JSON.stringify(embed)} />
    </>
  );
}
