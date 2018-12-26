import {clipboard, nativeImage} from 'electron';
import {subscribe, dispatch} from 'global-dispatcher';
import {wire} from 'hyperhtml/esm';
import debounce from 'just-debounce-it';
import ClippyElement from '../clippy-element';
import {clamp} from '../../util';
import {EVENT} from '../../../constants';
import '../clippy-item';
import './clippy-items.css';

class ClippyItems extends ClippyElement {
  constructor() {
    super();

    this.items = new Map();
    this._items = [];
    this._selectedItem = null;
    this._itemsToRender = [];
    this.pattern = null;

    this._saveItemsLazily = debounce(this._saveItems, 200);
  }

  connectedCallback() {
    this.role = 'list';

    subscribe(EVENT.ITEM_NEW, item => this.handleNewItem(item));
    subscribe(EVENT.ITEM_DELETE, hash => this.handleDeleteItem(hash));
    subscribe(EVENT.ITEM_SEARCH, pattern => this.handleSearch(pattern));

    subscribe(EVENT.ITEM_NEXT, () => this._selectNext());
    subscribe(EVENT.ITEM_COPY, () => this._copyItem());
    subscribe(EVENT.ITEM_PREVIOUS, () => this._selectPrevious());

    subscribe(EVENT.ITEMS_CLEAR, () => this.handleClearItems());
    subscribe(EVENT.ITEMS_RESTORE, items => this.handleRestoreItems(items));

    this.render();
  }

  _saveItems() {
    dispatch(EVENT.ITEMS_SAVE, this._items);
  }

  handleClearItems() {
    this.items.clear();
    this._items = [];
    this._selectedItem = null;
    this._itemsToRender = [];

    clipboard.clear();

    this._saveItems();

    this.render();
  }

  handleRestoreItems(items) {
    this.items.clear();
    this._items = [];

    for (const item of items) {
      this.items.set(item.hash, item);
      this._items.push(item);
      this._items = this._sortItems(this._items);
    }

    this._itemsToRender = this._items;
    this._selectedItem = this._items[0];

    this.render();
  }

  handleNewItem(item) {
    if (this.items.has(item.hash)) {
      this._items = this._items.filter(i => i.hash !== item.hash);
    }

    this.items.set(item.hash, item);
    this._items.unshift(item);
    this._items = this._sortItems(this._items);

    if (!this._pattern) {
      this._selectedItem = item;
      this._itemsToRender = this._items;
    }

    this._saveItemsLazily();

    this.render();
  }

  handleDeleteItem(hash = this._selectedItem.hash) {
    const position = this._itemsToRender.indexOf(this._selectedItem);
    const count = this._itemsToRender.length;

    this.items.delete(hash);
    this._items = this._items.filter(item => item.hash !== hash);
    this._itemsToRender = this._itemsToRender.filter(item => item.hash !== hash);

    if (position === count - 1) {
      this._selectPrevious();
    } else {
      this._selectNext();
    }

    this._saveItemsLazily();

    this.render();
  }

  _sortItems(items) {
    return items.sort((a, b) => {
      return b.timestamp - a.timestamp;
    });
  }

  _select(offset) {
    if (this._selectedItem) {
      const currentIndex = this._itemsToRender.indexOf(this._selectedItem);
      const nextIndex = clamp(currentIndex + offset, 0, this._itemsToRender.length - 1);
      this._selectedItem = this._itemsToRender[nextIndex];

      if (currentIndex === nextIndex) {
        return;
      }
    } else {
      this._selectedItem = this._itemsToRender[0];
    }

    this.render();
  }

  _selectPrevious() {
    this._select(-1);
  }

  _selectNext() {
    this._select(1);
  }

  _copyItem() {
    const selected = this._selectedItem;

    if (selected) {
      if (selected.type === 'image') {
        const image = nativeImage.createFromDataURL(selected.buffer);

        clipboard.write({image});
      } else {
        clipboard.write({
          text: selected.text,
          html: selected.html,
          rtf: selected.rtf
        });
      }
    }
  }

  _filterItems(pattern) {
    if (pattern) {
      // @TODO: Maybe use a better search algorithm
      try {
        const re = new RegExp(pattern, 'gim');
        const items = this._items.filter(item => {
          return item.type === 'text' && item.text.match(re);
        });

        this._selectedItem = items[0];

        return items;
      } catch (error) {
        this._selectedItem = this._items[0];
      }
    }

    if (!this._selectedItem) {
      this._selectedItem = this._items[0];
    }

    return this._items;
  }

  handleSearch(pattern) {
    this._pattern = pattern;
    this._itemsToRender = this._filterItems(this._pattern);
    this.render();
  }

  render() {
    dispatch(EVENT.ITEM_RENDER, this._selectedItem);

    if (this._itemsToRender.length > 0) {
      this.html`
        ${this._itemsToRender.map(item => wire(this, `:clippy-item-${item.hash}`)`
          <clippy-item
            data-hash="${item.hash}"
            data-type="${item.type}"
            class="${(this._selectedItem && (item.hash === this._selectedItem.hash)) ? 'selected' : ''}">
            ${item.type === 'image' ? `Image: ${item.width}x${item.height}` : item.text.trim().substr(0, 100)}
          </clippy-item>
        `)}
      `;

      requestAnimationFrame(() => {
        const currentItem = this.querySelector('clippy-item.selected');
        if (currentItem) {
          currentItem.scrollIntoView({
            block: 'nearest'
          });
        }
      });
    } else {
      this.html`
        <div class="not-found">
          <p>¯\\_(ツ)_/¯</p>
          <p>We couldn't find anything</p>
        </div>
      `;
    }
  }
}

customElements.define('clippy-items', ClippyItems);

export default ClippyItems;
