const {clipboard} = require('electron');
const crypto = require('crypto');


/**
 * A thing which tracks the system clipboard and calls a callback,
 * when new items are found on clipboard (when clipboard changes)
 *
 * @class ClipboardWatcher
 */
class ClipboardWatcher {
  constructor() {
    // A blank event emitter that gets replaced
    this.onData = _ => {};

    // A flag to stop recursion
    this._isListening = false;

    // An object storing the recent clipboard item
    this._recentClipItem = {};
    // this.clipboardItems = new Map();

    this._watchLoop = this._watchLoop.bind(this);
  }


  /**
   * Start listening for new items in clipboard,
   * new items are passed to the callback 'onData' which has to be overridden
   * over the instance of this class
   *
   *
   * @memberof ClipboardWatcher
   */
  startListening() {
    // Set this flag to true
    this._isListening = true;

    // Start recursive call
    this._watchLoop();
  }

  /**
   * A recursive function which listens for changes in system clipboard
   *
   *
   * @memberof ClipboardWatcher
   */
  _watchLoop() {
    // If at some point we want to stop listneing
    if (!this._isListening) {
      return;
    }

    // Extract possible text and image data
    const clipboardTextData = clipboard.readText();
    const clipboardImageData = clipboard.readImage();

    // If text is on the clipboard
    // And it has to be non-whitespace
    if (clipboardTextData.toString().trim()) {
      // Generate a hash from the text
      const textHash = crypto
        .createHash('sha256')
        .update(clipboardTextData)
        .digest('hex');

      // If the previous item's hash and current item's hash is exactly the same
      // then it is likely that the clipboard content's havent chahged from the
      // last time
      if (this._recentClipItem.hash !== textHash) {
        const newTextItem = {
          type: 'text',
          hash: textHash,
          timestamp: Date.now(),
        };
        // this.clipboardItems.set(textHash, newTextItem);

        this._recentClipItem = newTextItem;
        this._triggerNewItem();
      }
    } else if (clipboardImageData && !clipboardImageData.isEmpty()) {
      // We don't have text on clipboard but likely an image
      // Extract the image as png
      const pngImageData = clipboardImageData.toPNG();

      // Compute the hash from png data
      const imageHash = crypto
        .createHash('sha256')
        .update(pngImageData)
        .digest('hex');

      // Similar to plain text, if the hash hasn't changed then the contents
      // haven't changed
      if (this._recentClipItem.hash !== imageHash) {
        const newImageItem = {
          type: 'image',
          hash: imageHash,
          size: pngImageData.byteLength,
          timestamp: Date.now(),
        };
        // this.clipboardItems.set(imageHash, newImageItem);

        this._recentClipItem = newImageItem;
        this._triggerNewItem();
      }
    }

    // Call this recursively after 500ms for text, and a bit longer for images
    setTimeout(this._watchLoop, this._recentClipItem.type === 'image' ? 2000 : 500);
  }

  /**
   * Calls tha onData callback with the new item from clipboard
   *
   *
   * @memberof ClipboardWatcher
   */
  _triggerNewItem() {
    this.onData(this._recentClipItem);
  }
}


exports.ClipboardWatcher = ClipboardWatcher;
