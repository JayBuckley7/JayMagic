const DEFAULT_OPENAI_API_KEY = 'YOUR_DEFAULT_API_KEY'; // Replace with a default placeholder
const DEFAULT_BLACKLISTED_SITES = [
  'jisho.org/search/',
  'www.google.com/search'
];

const DEFAULT_MODEL = 'gpt-3.5-turbo';
const DEFAULT_SYSTEM_PROMPT = "You are a word replacer. Always provide the most common form in either Kanji or Hiragana (or katakana). Only provide one word, do not provide both kana and kanji. Do not provide the furigana if you provide the kanji. If the word is something too simple, like 'a', 'to', or 'it', provide a particle.";
const DEFAULT_USER_PROMPT = "Translate the following English word to Japanese, providing the most common form first, followed by a comma and the romaji, or a comma and '' if not applicable: ";

const RETRY_MODEL = 'gpt-4';
const RETRY_SYSTEM_PROMPT = "You are a word replacer. Always provide the most common form in either Kanji or Hiragana (or katakana). Only provide one word, do not provide both kana and kanji. Do not provide the furigana if you provide the kanji. If the word is something too simple, like 'a', 'to', or 'it', provide a particle.";
const RETRY_USER_PROMPT = "Translate the following English word to Japanese, providing the most common form first, followed by a comma and the romaji, or a comma and '' if not applicable: ";

let originalWordToRetry = ''; // Store the original word to retry

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

  // Set default model and prompts in local storage if not already set.
  chrome.storage.local.get({
    model: DEFAULT_MODEL,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    userPrompt: DEFAULT_USER_PROMPT,
    retryModel: RETRY_MODEL,
    retrySystemPrompt: RETRY_SYSTEM_PROMPT,
    retryUserPrompt: RETRY_USER_PROMPT
  }, (result) => {
    chrome.storage.local.set({
      model: result.model || DEFAULT_MODEL,
      systemPrompt: result.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      userPrompt: result.userPrompt || DEFAULT_USER_PROMPT,
      retryModel: result.retryModel || RETRY_MODEL,
      retrySystemPrompt: result.retrySystemPrompt || RETRY_SYSTEM_PROMPT,
      retryUserPrompt: result.retryUserPrompt || RETRY_USER_PROMPT
    }, () => {
      console.log("JayMagic: Model and prompts are set to default if not already set.");
    });
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

  chrome.contextMenus.create({
    id: "tryAgain",
    title: "Try again",
    contexts: ["selection"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("JayMagic: Error creating context menu:", chrome.runtime.lastError);
    } else {
      console.log("JayMagic: Context menu created successfully.");
    }
  });

  chrome.storage.local.get({ knownWords: {}, blacklistedSites: [] }, (result) => {
    let blacklistedSites = result.blacklistedSites;
    DEFAULT_BLACKLISTED_SITES.forEach(site => {
      if (!blacklistedSites.includes(site)) {
        blacklistedSites.push(site);
      }
    });
    chrome.storage.local.set({ blacklistedSites }, () => {
      console.log("JayMagic: Initialized blacklistedSites storage with default sites.");
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToDict" && info.selectionText) {
    addWordToDictionary(info.selectionText);
  }
  if (info.menuItemId === "tryAgain") {
    retryWithDifferentModel(originalWordToRetry, tab.id);
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
  if (request.action === 'setOriginalWord') {
    originalWordToRetry = request.originalWord;
    sendResponse({ status: 'ok' });
  }
  if (request.action === 'translateSentence') {
    translateSentence(request.sentence, request.knownWords, sendResponse);
    return true; // Keep the message channel open for sendResponse
  }
});

function addWordToDictionary(word) {
  // Convert word to lowercase
  const lowercaseWord = word.toLowerCase();

  chrome.storage.local.get({ knownWords: {} }, (result) => {
    const knownWords = result.knownWords;
    if (!knownWords[lowercaseWord]) {
      translateWord(lowercaseWord, (translation, furigana) => {
        knownWords[lowercaseWord] = { translation, furigana };
        chrome.storage.local.set({ knownWords }, () => {
          console.log(`JayMagic: Word "${lowercaseWord}" added to the dictionary with translation "${translation}" and furigana "${furigana}".`);
        });
      });
    }
  });
}

function translateWord(word, callback) {
  chrome.storage.local.get({ apiKey: DEFAULT_OPENAI_API_KEY, model: DEFAULT_MODEL, systemPrompt: DEFAULT_SYSTEM_PROMPT, userPrompt: DEFAULT_USER_PROMPT }, (result) => {
    const apiKey = result.apiKey;
    if (apiKey === DEFAULT_OPENAI_API_KEY) {
      console.error("JayMagic: Using default API key. Please update the API key in options.");
      return;
    }
    const messageRequest = {
      model: result.model,
      messages: [
        {
          role: "system",
          content: result.systemPrompt
        },
        {
          role: "user",
          content: `${result.userPrompt} ${word}.`
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
        const content = data.choices[0].message.content.trim();
        const [translation, furigana] = content.split(',');
        callback(translation.trim(), furigana ? furigana.trim() : '');
      } else {
        console.error('JayMagic: No translation received from OpenAI.');
      }
    })
    .catch(error => console.error('JayMagic: Error translating word:', error));
  });
}

function retryWithDifferentModel(word, tabId) {
  chrome.storage.local.get({ apiKey: DEFAULT_OPENAI_API_KEY, retryModel: RETRY_MODEL, retrySystemPrompt: RETRY_SYSTEM_PROMPT, retryUserPrompt: RETRY_USER_PROMPT }, (result) => {
    const apiKey = result.apiKey;
    if (apiKey === DEFAULT_OPENAI_API_KEY) {
      console.error("JayMagic: Using default API key. Please update the API key in options.");
      return;
    }
    const messageRequest = {
      model: result.retryModel,
      messages: [
        {
          role: "system",
          content: result.retrySystemPrompt
        },
        {
          role: "user",
          content: `${result.retryUserPrompt} ${word}.`
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
        const content = data.choices[0].message.content.trim();
        const [translation, furigana] = content.split(',');
        updateWordInDict(word, translation.trim(), furigana ? furigana.trim() : '');
      } else {
        console.error('JayMagic: No translation received from OpenAI.');
      }
    })
    .catch(error => console.error('JayMagic: Error translating word:', error));
  });
}

function updateWordInDict(originalWord, translation, furigana) {
  const updatedWord = originalWord.toLowerCase();

  // Get the dict as a JSON object
  chrome.storage.local.get({ knownWords: {} }, (result) => {
    const knownWords = result.knownWords;
    knownWords[originalWord] = { translation, furigana };

    // Update the dict
    chrome.storage.local.set({ knownWords }, () => {
      console.log(`JayMagic: Word "${originalWord}" updated in the dictionary with translation "${translation}" and furigana "${furigana}".`);

      // Notify the content script to update the word on the page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateTranslation',
          word: originalWord,
          translation: translation,
          furigana: furigana
        });
      });
    });
  });
}

function translateSentence(sentence, knownWords, callback) {
  chrome.storage.local.get({ apiKey: DEFAULT_OPENAI_API_KEY, model: DEFAULT_MODEL, systemPrompt: DEFAULT_SYSTEM_PROMPT }, (result) => {
    const apiKey = result.apiKey;
    if (apiKey === DEFAULT_OPENAI_API_KEY) {
      console.error("JayMagic: Using default API key. Please update the API key in options.");
      return;
    }
    
    // Create a list of known words in the format "word: translation"
    const knownWordsList = Object.entries(knownWords).map(([word, { translation }]) => `${word}: ${translation}`).join(', ');

    const messageRequest = {
      model: result.model,
      messages: [
        {
          role: "system",
          content: result.systemPrompt
        },
        {
          role: "user",
          content: `Translate the following English sentence to Japanese. Please try to use the following words where possible: ${knownWordsList}\nSentence: ${sentence}`
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    };

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
        const content = data.choices[0].message.content.trim();
        callback({ status: 'ok', translatedSentence: content });
      } else {
        console.error('JayMagic: No translation received from OpenAI.');
        callback({ status: 'error' });
      }
    })
    .catch(error => {
      console.error('JayMagic: Error translating sentence:', error);
      callback({ status: 'error' });
    });
  });
}
