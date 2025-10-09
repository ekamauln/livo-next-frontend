export function playSoundQcOnline(type: "success" | "error") {
  const audio = new Audio(`/sounds/qc-online/${type}.mp3`);
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}
