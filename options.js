document.addEventListener('DOMContentLoaded', () => {
    // Load the API key and model from storage
    chrome.storage.local.get({ apiKey: '', model: 'gpt-3.5-turbo', knownWords: {} }, (result) => {
      document.getElementById('apiKey').value = result.apiKey;
      document.getElementById('model').value = result.model;
      renderDictionary(result.knownWords);
    });
  
    // Save the API key to storage
    document.getElementById('saveApiKeyButton').addEventListener('click', () => {
      const apiKey = document.getElementById('apiKey').value;
      chrome.storage.local.set({ apiKey }, () => {
        alert('API Key saved!');
      });
    });
  
    // Save the model to storage
    document.getElementById('saveModelButton').addEventListener('click', () => {
      const model = document.getElementById('model').value;
      chrome.storage.local.set({ model }, () => {
        alert('Model saved!');
      });
    });
  
    // Add a new word to the dictionary
    document.getElementById('addWordButton').addEventListener('click', () => {
      document.getElementById('newWordEntry').style.display = 'flex';
    });
  
    // Save the new word
    document.getElementById('saveNewWordButton').addEventListener('click', () => {
      const newWord = document.getElementById('newWord').value.toLowerCase();
      const newTranslation = document.getElementById('newTranslation').value;
      const newFurigana = document.getElementById('newFurigana').value;
  
      if (newWord && newTranslation && newFurigana) {
        chrome.storage.local.get({ knownWords: {} }, (result) => {
          const knownWords = result.knownWords;
          knownWords[newWord] = { translation: newTranslation, furigana: newFurigana };
          chrome.storage.local.set({ knownWords }, () => {
            renderDictionary(knownWords);
            document.getElementById('newWordEntry').style.display = 'none';
            document.getElementById('newWord').value = '';
            document.getElementById('newTranslation').value = '';
            document.getElementById('newFurigana').value = '';
          });
        });
      } else {
        alert('Please enter the word, translation, and furigana.');
      }
    });
  
    // Cancel adding a new word
    document.getElementById('cancelNewWordButton').addEventListener('click', () => {
      document.getElementById('newWordEntry').style.display = 'none';
      document.getElementById('newWord').value = '';
      document.getElementById('newTranslation').value = '';
      document.getElementById('newFurigana').value = '';
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
      const dictionaryDiv = document.getElementById('dictionary');
      dictionaryDiv.innerHTML = '';
      for (const word in knownWords) {
        const wordEntry = document.createElement('div');
        wordEntry.className = 'word-entry';
  
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
  });
  