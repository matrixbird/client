export function create_initials(displayName, maxLength = 2) {
  if (!displayName) return '';
  const words = displayName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  const firstInitial = words[0].charAt(0);
  const lastInitial = words[words.length - 1].charAt(0);
  return (firstInitial + lastInitial).toUpperCase();
}

export function get_first_line(input) {
  if(!input) return
    const isHTML = /<\/?[a-z][\s\S]*>/i.test(input);

    if (isHTML) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(input, 'text/html');
        return doc.body.textContent.trim();
    } else {
        return input.replace(/\n/g, ' ');
    }
}
