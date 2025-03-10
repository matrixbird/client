export function create_initials(text, maxLength = 8) {
  if(!text) return
  let words = text?.split(/\s+/); 
  const initials = words?.map(word => word?.charAt(0)); 
  return initials?.join('').slice(0, maxLength);
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
