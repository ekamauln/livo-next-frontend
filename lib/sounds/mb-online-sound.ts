export function playSoundMbOnline(type: "success" | "error") {
  const audio = new Audio(`/sounds/mb-online/${type}.mp3`);
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}
