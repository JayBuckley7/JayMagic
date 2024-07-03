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
      document.getElementById('newWordEntry').style.display = 'block';
    });
  
    // Save the new word
    document.getElementById('saveNewWordButton').addEventListener('click', () => {
      const newWord = document.getElementById('newWord').value;
      const newTranslation = document.getElementById('newTranslation').value;
  
      if (newWord && newTranslation) {
        chrome.storage.local.get({ knownWords: {} }, (result) => {
          const knownWords = result.knownWords;
          knownWords[newWord] = newTranslation;
          chrome.storage.local.set({ knownWords }, () => {
            renderDictionary(knownWords);
            document.getElementById('newWordEntry').style.display = 'none';
            document.getElementById('newWord').value = '';
            document.getElementById('newTranslation').value = '';
          });
        });
      } else {
        alert('Please enter both the word and the translation.');
      }
    });
  
    // Cancel adding a new word
    document.getElementById('cancelNewWordButton').addEventListener('click', () => {
      document.getElementById('newWordEntry').style.display = 'none';
      document.getElementById('newWord').value = '';
      document.getElementById('newTranslation').value = '';
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
        translationInput.value = knownWords[word];
  
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', () => {
          const updatedWord = wordInput.value;
          const updatedTranslation = translationInput.value;
          knownWords[updatedWord] = updatedTranslation;
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
        wordEntry.appendChild(saveButton);
        wordEntry.appendChild(deleteButton);
  
        dictionaryDiv.appendChild(wordEntry);
      }
    }
  });
  