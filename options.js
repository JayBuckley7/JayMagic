document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const modelInput = document.getElementById('model');
    const modelSystemPromptInput = document.getElementById('modelSystemPrompt');
    const modelUserPromptInput = document.getElementById('modelUserPrompt');
    const retryModelInput = document.getElementById('retryModel');
    const retryModelSystemPromptInput = document.getElementById('retryModelSystemPrompt');
    const retryModelUserPromptInput = document.getElementById('retryModelUserPrompt');
    const dictionaryDiv = document.getElementById('dictionary');
    const newWordEntryDiv = document.getElementById('newWordEntry');
    const newWordInput = document.getElementById('newWord');
    const newTranslationInput = document.getElementById('newTranslation');
    const newFuriganaInput = document.getElementById('newFurigana');
    const blacklistedSitesDiv = document.getElementById('blacklistedSites');
  
    // Load the API key, model, model prompts, retry model, retry model prompts, known words, and blacklisted sites from storage
    chrome.storage.local.get({
        apiKey: '', 
        model: '', 
        systemPrompt: '', 
        userPrompt: '', 
        retryModel: '', 
        retrySystemPrompt: '', 
        retryUserPrompt: '', 
        knownWords: {}, 
        blacklistedSites: []
    }, (result) => {
        apiKeyInput.value = result.apiKey || '';
        modelInput.value = result.model || 'gpt-3.5-turbo';
        modelSystemPromptInput.value = result.systemPrompt || "You are a word replacer. Always provide the most common form in either Kanji or Hiragana (or katakana). Only provide one word, do not provide both kana and kanji. Do not provide the furigana if you provide the kanji. If the word is something too simple, like 'a', 'to', or 'it', provide a particle.";
        modelUserPromptInput.value = result.userPrompt || "Translate the following English word to Japanese, providing the most common form first, followed by a comma and the romaji, or a comma and '' if not applicable: ";
        retryModelInput.value = result.retryModel || 'gpt-4';
        retryModelSystemPromptInput.value = result.retrySystemPrompt || "You are a word replacer. Always provide the most common form in either Kanji or Hiragana (or katakana). Only provide one word, do not provide both kana and kanji. Do not provide the furigana if you provide the kanji. If the word is something too simple, like 'a', 'to', or 'it', provide a particle.";
        retryModelUserPromptInput.value = result.retryUserPrompt || "Translate the following English word to Japanese, providing the most common form first, followed by a comma and the romaji, or a comma and '' if not applicable: ";
        renderDictionary(result.knownWords);
        renderBlacklistedSites(result.blacklistedSites);
  
        // Check if the URL has the focus parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('focus') === 'blacklistedSites') {
            blacklistedSitesDiv.scrollIntoView();
        }
    });
  
    // Save the API key to storage
    document.getElementById('saveApiKeyButton').addEventListener('click', () => {
        const apiKey = apiKeyInput.value;
        chrome.storage.local.set({ apiKey }, () => {
            alert('API Key saved!');
        });
    });
  
    // Save the model settings to storage
    document.getElementById('saveModelButton').addEventListener('click', () => {
        const model = modelInput.value;
        const systemPrompt = modelSystemPromptInput.value;
        const userPrompt = modelUserPromptInput.value;
        chrome.storage.local.set({ model, systemPrompt, userPrompt }, () => {
            alert('Model settings saved!');
        });
    });
  
    // Save the retry model settings to storage
    document.getElementById('saveRetryModelButton').addEventListener('click', () => {
        const retryModel = retryModelInput.value;
        const retrySystemPrompt = retryModelSystemPromptInput.value;
        const retryUserPrompt = retryModelUserPromptInput.value;
        chrome.storage.local.set({ retryModel, retrySystemPrompt, retryUserPrompt }, () => {
            alert('Retry model settings saved!');
        });
    });
  
    // Add a new word to the dictionary
    document.getElementById('addWordButton').addEventListener('click', () => {
        newWordEntryDiv.style.display = 'flex';
    });
  
    // Save the new word
    document.getElementById('saveNewWordButton').addEventListener('click', () => {
        const newWord = newWordInput.value.toLowerCase();
        const newTranslation = newTranslationInput.value;
        const newFurigana = newFuriganaInput.value;
  
        if (newWord && newTranslation && newFurigana) {
            chrome.storage.local.get({ knownWords: {} }, (result) => {
                const knownWords = result.knownWords;
                knownWords[newWord] = { translation: newTranslation, furigana: newFurigana };
                chrome.storage.local.set({ knownWords }, () => {
                    renderDictionary(knownWords);
                    newWordEntryDiv.style.display = 'none';
                    newWordInput.value = '';
                    newTranslationInput.value = '';
                    newFuriganaInput.value = '';
                });
            });
        } else {
            alert('Please enter the word, translation, and furigana.');
        }
    });
  
    // Cancel adding a new word
    document.getElementById('cancelNewWordButton').addEventListener('click', () => {
        newWordEntryDiv.style.display = 'none';
        newWordInput.value = '';
        newTranslationInput.value = '';
        newFuriganaInput.value = '';
    });
  
    // Export the dictionary
    document.getElementById('exportDictionaryButton').addEventListener('click', () => {
        chrome.storage.local.get({ knownWords: {} }, (result) => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.knownWords));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "dictionary.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    });
  
    // Clear the dictionary
    document.getElementById('clearDictionaryButton').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the dictionary?')) {
            chrome.storage.local.set({ knownWords: {} }, () => {
                renderDictionary({});
                alert('Dictionary cleared!');
            });
        }
    });
  
    // Import the dictionary
    document.getElementById('importDictionaryButton').addEventListener('click', () => {
        document.getElementById('importDictionaryInput').click();
    });
  
    document.getElementById('importDictionaryInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const importedWords = JSON.parse(e.target.result);
                const lowerCasedWords = {};
                for (const key in importedWords) {
                    lowerCasedWords[key.toLowerCase()] = importedWords[key];
                }
                chrome.storage.local.get({ knownWords: {} }, (result) => {
                    const knownWords = { ...result.knownWords, ...lowerCasedWords };
                    chrome.storage.local.set({ knownWords }, () => {
                        renderDictionary(knownWords);
                        alert('Dictionary imported!');
                    });
                });
            };
            reader.readAsText(file);
        }
    });
  
    // Render the dictionary
    function renderDictionary(knownWords) {
        dictionaryDiv.innerHTML = '';
        for (const word in knownWords) {
            const wordEntry = document.createElement('div');
            wordEntry.className = 'jmagic-word-entry';
  
            const wordInput = document.createElement('input');
            wordInput.type = 'text';
            wordInput.value = word;
            wordInput.disabled = true;
  
            const translationInput = document.createElement('input');
            translationInput.type = 'text';
            translationInput.value = knownWords[word].translation;
  
            const furiganaInput = document.createElement('input');
            furiganaInput.type = 'text';
            furiganaInput.value = knownWords[word].furigana;
  
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.addEventListener('click', () => {
                const updatedWord = wordInput.value;
                const updatedTranslation = translationInput.value;
                const updatedFurigana = furiganaInput.value;
                knownWords[updatedWord] = { translation: updatedTranslation, furigana: updatedFurigana };
                chrome.storage.local.set({ knownWords }, () => {
                    alert('Word updated!');
                });
            });
  
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                delete knownWords[word];
                chrome.storage.local.set({ knownWords }, () => {
                    renderDictionary(knownWords);
                    alert('Word deleted!');
                });
            });
  
            wordEntry.appendChild(wordInput);
            wordEntry.appendChild(translationInput);
            wordEntry.appendChild(furiganaInput);
            wordEntry.appendChild(saveButton);
            wordEntry.appendChild(deleteButton);
  
            dictionaryDiv.appendChild(wordEntry);
        }
    }
  
    // Render the blacklisted sites
    function renderBlacklistedSites(blacklistedSites) {
        blacklistedSitesDiv.innerHTML = '';
  
        blacklistedSites.forEach(site => {
            const siteEntry = document.createElement('div');
            siteEntry.className = 'jmagic-site-entry';
  
            const siteInput = document.createElement('input');
            siteInput.type = 'text';
            siteInput.value = site;
            siteInput.disabled = true;
  
            const editSiteInput = document.createElement('input');
            editSiteInput.type = 'text';
            editSiteInput.value = site;
  
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.addEventListener('click', () => {
                const index = blacklistedSites.indexOf(site);
                if (index > -1) {
                    blacklistedSites[index] = editSiteInput.value;
                    chrome.storage.local.set({ blacklistedSites }, () => {
                        renderBlacklistedSites(blacklistedSites);
                        alert('Site updated in blacklist!');
                    });
                }
            });
  
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Remove';
            deleteButton.addEventListener('click', () => {
                const index = blacklistedSites.indexOf(site);
                if (index > -1) {
                    blacklistedSites.splice(index, 1);
                }
                chrome.storage.local.set({ blacklistedSites }, () => {
                    renderBlacklistedSites(blacklistedSites);
                    alert('Site removed from blacklist!');
                });
            });
  
            siteEntry.appendChild(siteInput);
            siteEntry.appendChild(editSiteInput);
            siteEntry.appendChild(saveButton);
            siteEntry.appendChild(deleteButton);
            blacklistedSitesDiv.appendChild(siteEntry);
        });
    }
  
    // Handle collapsible sections
    document.querySelectorAll('.jmagic-collapsible').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
                this.innerHTML = this.innerHTML.replace('▲', '▼');
            } else {
                content.style.display = "block";
                this.innerHTML = this.innerHTML.replace('▼', '▲');
            }
        });
    });
  });
  