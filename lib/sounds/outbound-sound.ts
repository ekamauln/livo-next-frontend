export function playSoundOutbound(
  type:
    | "j&t-express"
    | "anteraja"
    | "id-express"
    | "instant"
    | "jne"
    | "spx"
    | "j&t-cargo"
    | "lex"
    | "wahana"
    | "error"
    | string // Allow any string to handle unknown expedition slugs
) {
  // Default to error sound if type is not recognized
  const soundFile = [
    "j&t-express",
    "anteraja", 
    "id-express",
    "instant",
    "jne",
    "spx",
    "j&t-cargo",
    "lex",
    "wahana"
  ].includes(type) ? type : "error";
  
  const audio = new Audio(`/sounds/outbound/${soundFile}.mp3`);
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}
