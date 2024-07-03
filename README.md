# JayMagic Chrome Extension

JayMagic is a Chrome extension designed to replace specific words on a webpage with their Japanese equivalents, complete with tooltips for additional context. This extension is particularly useful for language learners or anyone looking to enhance their Japanese vocabulary.

## Features

- Replace known words on any webpage with their Japanese translations.
- Add new words to the dictionary via the context menu.
- Tooltips provide additional context, such as furigana.
- Manage your dictionary through the options page.

## Installation

1. Clone the repository or download the ZIP file.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle in the top right corner.
4. Click "Load unpacked" and select the extension folder.

## Usage

### Adding Words to the Dictionary

To add a word to your dictionary:

1. Highlight the word you want to add.
2. Right-click to open the context menu.
3. Select "Add to dict".
4. The word will be added to your dictionary and replaced with its Japanese translation on the webpage.



https://github.com/JayBuckley7/JayMagic/assets/37486350/30256744-c573-4275-9634-3639c04c0d87



### Managing Your Dictionary

You can view and manage your dictionary from the options page.

![Options Page](https://i.gyazo.com/b7458b6cb82cabd8bf8fa9eed60d05e7.png)

## Development

### File Structure

- `manifest.json`: The manifest file for the Chrome extension.
- `background.js`: Handles context menu interactions and storage.
- `content.js`: Replaces known words on the webpage.
- `options.html`: The options page for managing the dictionary.
- `options.js`: JavaScript for the options page.
- `styles.css`: Styles for the tooltips.
