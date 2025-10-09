export function playSoundQcRibbon(type: "success" | "error") {
  const audio = new Audio(`/sounds/qc-ribbon/${type}.mp3`);
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}
