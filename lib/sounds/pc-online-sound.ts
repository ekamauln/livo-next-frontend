export function playSoundPcOnline(type: "success" | "error") {
  const audio = new Audio(`/sounds/pc-online/${type}.mp3`);
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}
