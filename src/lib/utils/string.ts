export function create_initials(displayName: string | undefined) {
  if (!displayName) return '';
  const words: string[] = displayName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  const firstInitial = words[0].charAt(0);
  const lastInitial = words[words.length - 1].charAt(0);
  return (firstInitial + lastInitial).toUpperCase();
}

export function get_first_line(input: string) {
  if(!input) return
    const isHTML = /<\/?[a-z][\s\S]*>/i.test(input);

    if (isHTML) {
        const parser: DOMParser = new DOMParser();
        const doc: Document = parser.parseFromString(input, 'text/html');
        return doc.body.textContent?.trim();
    } else {
        return input.replace(/\n/g, ' ');
    }
}
