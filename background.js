const DEFAULT_OPENAI_API_KEY = 'YOUR_DEFAULT_API_KEY'; // Replace with a default placeholder

chrome.runtime.onInstalled.addListener(() => {
  console.log("JayMagic: Extension installed, creating context menu...");

  // Set the default API key in local storage if not already set.
  chrome.storage.local.get({ apiKey: DEFAULT_OPENAI_API_KEY }, (result) => {
    if (!result.apiKey || result.apiKey === DEFAULT_OPENAI_API_KEY) {
      chrome.storage.local.set({ apiKey: DEFAULT_OPENAI_API_KEY }, () => {
        console.log("JayMagic: API key is set to default. Please update the API key in options.");
      });
    } else {
      console.log("JayMagic: API key is set and ready to use.");
    }
  });

  chrome.contextMenus.create({
    id: "addToDict",
    title: "Add to dict",
    contexts: ["selection"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("JayMagic: Error creating context menu:", chrome.runtime.lastError);
    } else {
      console.log("JayMagic: Context menu created successfully.");
    }
  });

  chrome.storage.local.get({ knownWords: {} }, (result) => {
    console.log("JayMagic: Initial knownWords:", result.knownWords);
    if (!result.knownWords) {
      chrome.storage.local.set({ knownWords: {} }, () => {
        console.log("JayMagic: Initialized knownWords storage.");
      });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToDict" && info.selectionText) {
    addWordToDictionary(info.selectionText);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getWords") {
    chrome.storage.local.get({ knownWords: {} }, (result) => {
      sendResponse({ words: result.knownWords });
    });
    return true; // Keep the message channel open for sendResponse
  }
  if (request.action === "translateWord") {
    translateWord(request.word, sendResponse);
    return true; // Keep the message channel open for sendResponse
  }
});

function addWordToDictionary(word) {
  chrome.storage.local.get({ knownWords: {} }, (result) => {
    const knownWords = result.knownWords;
    if (!knownWords[word]) {
      translateWord(word, (translation) => {
        knownWords[word] = translation;
        chrome.storage.local.set({ knownWords }, () => {
          console.log(`JayMagic: Word "${word}" added to the dictionary with translation "${translation}".`);
        });
      });
    }
  });
}

function translateWord(word, callback) {
  chrome.storage.local.get({ apiKey: DEFAULT_OPENAI_API_KEY }, (result) => {
    const apiKey = result.apiKey;
    if (apiKey === DEFAULT_OPENAI_API_KEY) {
      console.error("JayMagic: Using default API key. Please update the API key in options.");
      return;
    }
    const messageRequest = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a word replacer. Always provide the most common form in either Kanji or Hiragana (or katakana). Only provide one word do not provide both kana and kanji. do not provide the furigana if you provide the kanji. If the word is something too simple, like a or to or it for example, you can put a particle."
        },
        {
          role: "user",
          content: `For the following English word: ${word}. Respond back with Only the most common form of this word in Japanese Hiragana or Kanji (or katakana), or similar particle. Do not provide the furigana if you provide the kanji.`
        }
      ],
      max_tokens: 60,
      temperature: 0.3
    };
    
    // Log the message request to the console for verification
    console.log('JayMagic: Message request to OpenAI:', messageRequest);

    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(messageRequest)
    })
    .then(response => response.json())
    .then(data => {
      console.log('JayMagic: Response from OpenAI:', data);  // Log the entire response
      if (data.choices && data.choices.length > 0) {
        const translation = data.choices[0].message.content.trim();
        callback(translation);
      } else {
        console.error('JayMagic: No translation received from OpenAI.');
      }
    })
    .catch(error => console.error('JayMagic: Error translating word:', error));
  });
}


