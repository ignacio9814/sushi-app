export function formatRetiroEstimado(hora: string, ampm: "AM" | "PM") {
  if (!hora || !ampm) return "";
  return `estimado ${hora}:00 ${ampm}`;
}
