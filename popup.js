document.addEventListener('DOMContentLoaded', () => {
  const disableButton = document.getElementById('disableButton');
  const enableButton = document.getElementById('enableButton');
  const optionsLink = document.getElementById('optionsLink');

  disableButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const url = new URL(tab.url);
      const domain = url.hostname;
      const path = url.pathname;
      const fullEntry = `${domain}${path}`;

      chrome.storage.sync.get({ blacklistedSites: [] }, (result) => {
        const blacklistedSites = result.blacklistedSites;
        if (!blacklistedSites.includes(fullEntry)) {
          blacklistedSites.push(fullEntry);
          chrome.storage.sync.set({ blacklistedSites }, () => {
            console.log(`JayMagic: Path "${fullEntry}" added to the blacklist.`);
            alert(`Path "${fullEntry}" has been disabled.`);
          });
        } else {
          alert(`Path "${fullEntry}" is already disabled.`);
        }
      });
    });
  });

  enableButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const url = new URL(tab.url);
      const domain = url.hostname;
      const path = url.pathname;
      const fullEntry = `${domain}${path}`;

      chrome.storage.sync.get({ blacklistedSites: [] }, (result) => {
        const blacklistedSites = result.blacklistedSites;
        const index = blacklistedSites.indexOf(fullEntry);
        if (index > -1) {
          blacklistedSites.splice(index, 1);
          chrome.storage.sync.set({ blacklistedSites }, () => {
            console.log(`JayMagic: Path "${fullEntry}" removed from the blacklist.`);
            alert(`Path "${fullEntry}" has been enabled.`);
          });
        } else {
          alert(`Path "${fullEntry}" is not disabled.`);
        }
      });
    });
  });

  optionsLink.addEventListener('click', (event) => {
    event.preventDefault();
    chrome.runtime.openOptionsPage(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.update(tabs[0].id, { url: chrome.runtime.getURL('options.html?focus=blacklistedSites') });
      });
    });
  });
});
