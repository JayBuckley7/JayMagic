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
  let span = document.createElement('span');
  let lastIndex = 0;
  let replaced = false;
  let replacedCount = 0;

  const words = Object.keys(knownWords).join('|');
  const translations = Object.values(knownWords).map(word => word.translation).join('|');
  const regex = new RegExp(`\\b(${words})\\b`, 'gi');
  const regexTranslations = new RegExp(`(${translations})`, 'g');
  const originalContent = content;

  // Replace English to Japanese
  content.replace(regex, (match, p1, offset) => {
    p1 = p1.toLowerCase();
    span.appendChild(document.createTextNode(content.slice(lastIndex, offset)));

    const translation = knownWords[p1].translation;
    const furigana = knownWords[p1].furigana;
    const tooltip = furigana ? `${furigana} :)` : `:)`;

    let anchor = document.createElement('a');
    if (textNode.parentNode.nodeName.toLowerCase() === 'a' && textNode.parentNode.href) {
      anchor = textNode.parentNode.cloneNode();
      anchor.href = textNode.parentNode.href;
    } else {
      anchor.href = `https://jisho.org/search/${translation}`;
    }

    anchor.target = '_blank';
    anchor.className = 'jaymagic-tooltip';
    anchor.dataset.originalWord = p1;
    anchor.title = tooltip;
    anchor.textContent = translation;

    span.appendChild(anchor);
    lastIndex = offset + match.length;
    replaced = true;
    replacedCount++;
  });

  // Replace Japanese to Japanese
  content.replace(regexTranslations, (match, p1, offset) => {
    span.appendChild(document.createTextNode(content.slice(lastIndex, offset)));

    // Find the original English word that maps to this Japanese translation
    const originalWord = Object.keys(knownWords).find(key => knownWords[key].translation === p1);
    const furigana = knownWords[originalWord].furigana;
    const tooltip = furigana ? `${furigana} :)` : `:)`;

    let anchor = document.createElement('a');
    if (textNode.parentNode.nodeName.toLowerCase() === 'a' && textNode.parentNode.href) {
      anchor = textNode.parentNode.cloneNode();
      anchor.href = textNode.parentNode.href;
    } else {
      anchor.href = `https://jisho.org/search/${p1}`;
    }

    anchor.target = '_blank';
    anchor.className = 'jaymagic-tooltip';
    anchor.dataset.originalWord = originalWord;
    anchor.title = tooltip;
    anchor.textContent = p1;

    span.appendChild(anchor);
    lastIndex = offset + match.length;
    replaced = true;
    replacedCount++;
  });

  span.appendChild(document.createTextNode(content.slice(lastIndex)));

  if (replaced) {
    // Check if more than 50% of the sentence has been translated
    const totalWords = originalContent.split(/\s+/).length;
    const percentageReplaced = (replacedCount / totalWords) * 100;
    if (totalWords >= 3 && percentageReplaced > 50) {
      const sparkle = document.createElement('img');
      sparkle.src = chrome.runtime.getURL('sparkle.png');
      sparkle.style.width = '16px';
      sparkle.style.height = '16px';
      sparkle.style.cursor = 'pointer';
      sparkle.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          action: 'translateSentence',
          sentence: originalContent,
          knownWords: knownWords // Pass the known words to the background script
        }, (response) => {
          if (response.status === 'ok' && response.translatedSentence) {
            const newSpan = document.createElement('span');
            newSpan.innerHTML = response.translatedSentence;
            span.replaceWith(newSpan);
          }
        });
      });
      span.appendChild(sparkle);
    }

    textNode.parentNode.replaceChild(span, textNode);
  }
}

// Check if the current site is blacklisted
function isBlacklisted(url, blacklistedSites) {
  return blacklistedSites.some(site => url.includes(site));
}

// Initialize the known words and replace them on page load
chrome.storage.local.get({ knownWords: {}, blacklistedSites: [] }, (result) => {
  const currentUrl = window.location.href;
  if (!isBlacklisted(currentUrl, result.blacklistedSites)) {
    replaceKnownWords(result.knownWords);
  } else {
    console.log("JayMagic: Site is blacklisted, skipping translation.");
  }
});

// Listen for changes to the known words and update the replacements
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    chrome.storage.local.get({ blacklistedSites: [] }, (result) => {
      const currentUrl = window.location.href;
      if (!isBlacklisted(currentUrl, result.blacklistedSites)) {
        if (changes.knownWords) {
          replaceKnownWords(changes.knownWords.newValue);
        }
      } else {
        console.log("JayMagic: Site is blacklisted, skipping translation.");
      }
    });
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateTranslation') {
    updateTranslationOnPage(request.word, request.translation, request.furigana);
    sendResponse({ status: 'ok' });
  }
});

// Function to update the translation on the page
function updateTranslationOnPage(word, translation, furigana) {
  document.querySelectorAll('.jaymagic-tooltip').forEach(element => {
    if (element.dataset.originalWord === word) {
      element.textContent = translation;
      element.title = furigana ? `${furigana} :)` : ':)';
    }
  });
}

// Add listener for context menu event
document.addEventListener('contextmenu', (event) => {
  const selection = window.getSelection().toString().toLowerCase();
  if (selection) {
    const anchor = event.target.closest('.jaymagic-tooltip');
    if (anchor) {
      chrome.runtime.sendMessage({
        action: 'setOriginalWord',
        originalWord: anchor.dataset.originalWord
      }, (response) => {
        if (response.status === 'ok') {
          console.log(`Original word "${anchor.dataset.originalWord}" set for retry.`);
        }
      });
    }
  }
});
