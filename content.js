(function() {
  let knownWords = {};

  // Function to replace known words on the page
  function replaceKnownWords(knownWords) {
    walk(document.body, knownWords);
  }

  function walk(node, knownWords) {
    let child, next;

    switch (node.nodeType) {
      case 1: // Element
      case 9: // Document
      case 11: // Document fragment
        child = node.firstChild;
        while (child) {
          next = child.nextSibling;
          walk(child, knownWords);
          child = next;
        }
        break;
      case 3: // Text node
        handleText(node, knownWords);
        break;
    }
  }

  function handleText(textNode, knownWords) {
    let content = textNode.nodeValue;
  
    // Create a span element to hold the new content
    const span = document.createElement('span');
    let lastIndex = 0;
    let replaced = false;
  
    // Build a single regex to match any of the known words
    const words = Object.keys(knownWords).join('|');
    const regex = new RegExp(`\\b(${words})\\b`, 'gi');
  
    content.replace(regex, (match, p1, offset) => {
      p1 = p1.toLowerCase();
      // Append text before the match
      span.appendChild(document.createTextNode(content.slice(lastIndex, offset)));
  
      // Get the translation and tooltip
      const translation = knownWords[p1].translation;
      const furigana = knownWords[p1].furigana;
      const tooltip = furigana ? `${furigana} :)` : `:)`;
  
      // Create the anchor element with the tooltip
      const anchor = document.createElement('a');
      anchor.href = `https://jisho.org/search/${translation}`;
      anchor.target = '_blank';
      anchor.className = 'jaymagic-tooltip';
      anchor.title = tooltip;
      anchor.textContent = translation;
  
      span.appendChild(anchor);
  
      // Update the lastIndex to the end of the match
      lastIndex = offset + match.length;
      replaced = true;
    });
  
    // Append any remaining text after the last match
    span.appendChild(document.createTextNode(content.slice(lastIndex)));
  
    // Replace the content only if replacements were made
    if (replaced) {
      textNode.parentNode.replaceChild(span, textNode);
    }
  }
  
  
  

  // Efficiently handle DOM mutations
  function init() {
    chrome.storage.local.get(['knownWords'], function(result) {
      knownWords = result.knownWords || {};
      replaceKnownWords(knownWords);
    });

    // Listen for changes to the known words and update the replacements
    chrome.storage.onChanged.addListener(function(changes, areaName) {
      if (areaName === 'local' && changes.knownWords) {
        knownWords = changes.knownWords.newValue || {};
        replaceKnownWords(knownWords);
      }
    });
  }

  // Run the script once the page has fully loaded
  window.addEventListener('load', init);
})();
