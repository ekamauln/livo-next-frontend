export function playSoundMbRibbon(type: "success" | "error") {
  const audio = new Audio(`/sounds/mb-ribbon/${type}.mp3`);
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}
