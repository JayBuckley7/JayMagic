(function() {
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
    for (const word in knownWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi'); // Word boundary to match whole words only
      content = content.replace(regex, (match) => `<span class="jaymagic-tooltip" title=":)">${knownWords[word]}</span>`);
    }
    if (content !== textNode.nodeValue) {
      const span = document.createElement('span');
      span.innerHTML = content;
      textNode.parentNode.replaceChild(span, textNode);
    }
  }

  // Retrieve known words from storage and replace them on the page
  chrome.storage.local.get(['knownWords'], function(result) {
    if (result.knownWords) {
      replaceKnownWords(result.knownWords);
    }
  });

  // Listen for changes to the known words and update the replacements
  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'local' && changes.knownWords) {
      replaceKnownWords(changes.knownWords.newValue);
    }
  });
})();
