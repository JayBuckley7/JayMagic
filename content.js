(function() {
  let knownWords = {};
  let blacklistedSites = [];

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

    const span = document.createElement('span');
    let lastIndex = 0;
    let replaced = false;

    const words = Object.keys(knownWords).join('|');
    const regex = new RegExp(`\\b(${words})\\b`, 'gi');

    content.replace(regex, (match, p1, offset) => {
      p1 = p1.toLowerCase();
      span.appendChild(document.createTextNode(content.slice(lastIndex, offset)));

      const translation = knownWords[p1].translation;
      const furigana = knownWords[p1].furigana;
      const tooltip = furigana ? `${furigana} :)` : `:)`;

      const anchor = document.createElement('a');
      anchor.href = `https://jisho.org/search/${translation}`;
      anchor.target = '_blank';
      anchor.className = 'jaymagic-tooltip';
      anchor.title = tooltip;
      anchor.textContent = translation;

      span.appendChild(anchor);

      lastIndex = offset + match.length;
      replaced = true;
    });

    span.appendChild(document.createTextNode(content.slice(lastIndex)));

    if (replaced) {
      textNode.parentNode.replaceChild(span, textNode);
    }
  }

  function init() {
    chrome.storage.local.get(['knownWords', 'blacklistedSites'], function(result) {
      knownWords = result.knownWords || {};
      blacklistedSites = result.blacklistedSites || [];

      const url = new URL(window.location.href);
      const fullEntry = `${url.hostname}${url.pathname}`;

      if (!blacklistedSites.some(site => fullEntry.startsWith(site))) {
        replaceKnownWords(knownWords);
      }
    });

    chrome.storage.onChanged.addListener(function(changes, areaName) {
      if (areaName === 'local') {
        if (changes.knownWords) {
          knownWords = changes.knownWords.newValue || {};
          const url = new URL(window.location.href);
          const fullEntry = `${url.hostname}${url.pathname}`;

          if (!blacklistedSites.some(site => fullEntry.startsWith(site))) {
            replaceKnownWords(knownWords);
          }
        }
        if (changes.blacklistedSites) {
          blacklistedSites = changes.blacklistedSites.newValue || [];
          const url = new URL(window.location.href);
          const fullEntry = `${url.hostname}${url.pathname}`;

          if (blacklistedSites.some(site => fullEntry.startsWith(site))) {
            window.location.reload();
          }
        }
      }
    });
  }

  window.addEventListener('load', init);
})();
