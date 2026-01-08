export function stripSelectorBraces(selector: string, andQuotes = false) {
  let result = selector;
  
  // Remove selector type markers:
  // - Leading [ and trailing ] for attribute selectors (even if inside quotes)
  // - Leading . for class selectors (even if inside quotes)
  // But preserve dots/brackets that are part of the selector name itself
  
  // Find and remove attribute brackets: [selector] -> selector
  // Use regex to find [ at start (possibly after quotes/spaces) and ] at end
  result = result.replace(/^([\s']*)\[/, '$1').replace(/\]([\s']*)$/, '$1');
  
  // Find and remove class dot prefix: .selector -> selector
  // Use regex to find . at start (possibly after quotes/spaces)
  result = result.replace(/^([\s']*)\./, '$1');
  
  // Remove quotes if requested (do this last so we can find brackets/dots inside quotes)
  if (andQuotes) {
    result = result.replace(/'/g, '');
  }
  
  return result;
}
