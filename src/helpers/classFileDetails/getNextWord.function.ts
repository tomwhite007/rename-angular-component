export function getNextWord(text: string) {
  text = text.replace(/[\v\s]+/g, ' ');
  text = text.trim();
  text = text.split(' ')[0];
  return text;
}
