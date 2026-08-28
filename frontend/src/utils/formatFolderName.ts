function replaceCharacters(value: string) {
  return value
    .replace(/\./g, " ")
    .replace(/-/g, " - ")
    .trim();
}

function capitalizeFirstLetters(value: string) {
  return value
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatFolderName(value: string) {
  const replaced = replaceCharacters(value);
  return capitalizeFirstLetters(replaced);
}

