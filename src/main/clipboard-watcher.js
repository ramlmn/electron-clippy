import {clipboard} from 'electron';
import EventEmitter from 'events';
import crypto from 'crypto';

/**
 * A thing which tracks the system clipboard and calls a callback,
 * when new items are found on clipboard (when clipboard changes)
 *
 * @class ClipboardWatcher
 */
class ClipboardWatcher extends EventEmitter {
  constructor() {
    super();

    // A flag to stop recursion
    this._isListening = false;

    // An object storing the recent clipboard item
    this._recentClipItem = {};

    this._watchLoop = this._watchLoop.bind(this);
  }

  /**
   * Start listening for new items in clipboard
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
   * @memberof ClipboardWatcher
   */
  _watchLoop() {
    // If at some point we want to stop listneing
    if (!this._isListening) {
      return;
    }

    this._scrapeClipboard();

    setTimeout(this._watchLoop, 1000);
  }

  /**
   * The function that scrapes the clipboard, analyzes all the available types
   * and generates a clipboard item
   *
   * @memberof ClipboardWatcher
   */
  _scrapeClipboard() {
    const availableFormats = clipboard.availableFormats();

    // This happens when user copies something that is not accessible by
    // electron (like copying system files)
    if (availableFormats.length === 0) {
      return;
    }

    // A template with all the data needed to represent a clipboard item
    const newClipItem = {
      hash: '',
      type: '',
      timestamp: 0,
      data: {
        text: '',
        html: '',
        rtf: '',
        image: ''
      },

      // Data for image
      thumb: '',
      width: 0,
      height: 0,

      // Data for text
      length: 0
    };

    // Extract all the available formats of data on the clipboard
    for (const format of availableFormats) {
      // HTML and RTF formats are also considered plain text
      if (format.startsWith('text/')) {
        newClipItem.type = 'text';

        if (format === 'text/plain') {
          newClipItem.data.text = clipboard.readText();
        } else if (format === 'text/html') {
          newClipItem.data.html = clipboard.readHTML();
        } else if (format === 'text/rtf') {
          newClipItem.data.rtf = clipboard.readRTF();
        }
      } else if (format.startsWith('image/')) {
        newClipItem.type = 'image';

        const imageData = clipboard.readImage();
        newClipItem.data.image = imageData.toDataURL();
      }
    }

    // Check if the new item is the same as old one
    // (i.e. if clipboard contents have changed)
    if (!this._isNewItem(newClipItem)) {
      return;
    }

    // Some more comparions to set more data to the item
    // width and height for image (also generate a thumbnail)
    // character length for plain text
    // also cryptographic hash to identify them
    if (newClipItem.type === 'image') {
      newClipItem.hash = crypto
        .createHash('sha256')
        .update(newClipItem.data.image)
        .digest('hex');

      const imageData = clipboard.readImage();
      const imageDimensions = imageData.getSize();

      newClipItem.width = imageDimensions.width;
      newClipItem.height = imageDimensions.height;

      newClipItem.thumb = this._generateThumbForImage(imageData);
    } else if (newClipItem.data.text.trim()) {
      newClipItem.length = [...newClipItem.data.text].length;

      newClipItem.hash = crypto
        .createHash('sha256')
        .update(newClipItem.data.text)
        .digest('hex');
    } else {
      return;
    }

    newClipItem.timestamp = Date.now();

    this._recentClipItem = newClipItem;
    this.emit('item', newClipItem);
  }

  /**
   * Generates a base64 thumbnail for the provided native image
   *
   * @param {NativeImage} nativeImageData For which thumbnail is to be generated
   * @returns {string} base64 representation of thumbnail
   * @memberof ClipboardWatcher
   */
  _generateThumbForImage(nativeImageData) {
    const aspectRatio = nativeImageData.getAspectRatio();
    const imageDimensions = nativeImageData.getSize();

    const resizeOptions = {
      width: 300,
      height: 300
    };

    if (imageDimensions.width > resizeOptions.width) {
      resizeOptions.width /= aspectRatio;
    } else {
      resizeOptions.width = imageDimensions.width;
    }

    if (imageDimensions.height > resizeOptions.height) {
      resizeOptions.height /= aspectRatio;
    } else {
      resizeOptions.height = imageDimensions.height;
    }

    const thumb = nativeImageData.resize(resizeOptions);
    return thumb.toDataURL();
  }

  /**
   * Compares with the old item available and determines if it is a new item
   * or exactly same as the old one
   *
   * @param {Object} newItem The possibly new item object to check for
   * @returns {Boolean} Returns true if same otherwise false
   * @memberof ClipboardWatcher
   */
  _isNewItem(newItem) {
    const oldItem = this._recentClipItem;

    // For the first time app starts (there is no previous item)
    if (!oldItem) {
      return true;
    }

    // Checking if their types are same
    // If they are not then is is obviously a new item
    if (oldItem.type !== newItem.type) {
      return true;
    }

    // For an image to be new its base64 string should be different
    // Text is considered new if any of `text`, `html`, `rtf` parts change
    if (oldItem.type === 'image') {
      return (oldItem.data.image !== newItem.data.image);
    }

    if (oldItem.type === 'text') {
      return (
        oldItem.data.text !== newItem.data.text ||
        oldItem.data.html !== newItem.data.html ||
        oldItem.data.rtf !== newItem.data.rtf
      );
    }
  }
}

export default ClipboardWatcher;
