import {clipboard, nativeImage} from 'electron';
import {subscribe, dispatch} from 'global-dispatcher';
import {wire} from 'hyperhtml/esm';
import debounce from 'just-debounce-it';
import ClippyElement from '../clippy-element';
import {clamp} from '../../util';
import {EVENT} from '../../../constants';
import '../clippy-item';
import './clippy-items.css';

// @TODO: refactor whole component
class ClippyItems extends ClippyElement {
  constructor() {
    super();

    this.items = new Map();
    this._flattened = [];
    this._seleted = null;
    this.pattern = null;

    this._saveItemsLazily = debounce(this._saveItems, 200);
  }

  connectedCallback() {
    this.role = 'list';

    subscribe(EVENT.ITEM_NEW, item => this.handleNewItem(item));
    subscribe(EVENT.ITEM_DELETE, hash => this.handleDeleteItem(hash));
    subscribe(EVENT.ITEM_SEARCH, pattern => this.handleSearch(pattern));

    subscribe(EVENT.ITEM_NEXT, () => this._selectNext());
    subscribe(EVENT.ITEM_SELECT, () => this._selectItem());
    subscribe(EVENT.ITEM_PREVIOUS, () => this._selectPrevious());

    subscribe(EVENT.ITEMS_CLEAR, () => this.handleClearItems());

    this.render();
  }

  _saveItems() {
    dispatch(EVENT.ITEMS_SAVE, this._flattened);
  }

  handleClearItems() {
    this._flattened = [];
    this.items.clear();

    this._saveItems();

    this.render();
  }

  handleNewItem(item) {
    if (this.items.has(item.hash)) {
      this._flattened = this._flattened.filter(i => i.hash !== item.hash);
    }

    this.items.set(item.hash, item);
    this._flattened.unshift(item);
    this._flattened = this._sortItems(this._flattened);

    if (!this.pattern) {
      this._selected = item;
    }

    this._saveItemsLazily();

    this.render();
  }

  handleDeleteItem(hash = this._selected.hash) {
    if (this._flattened.indexOf(this._selected) === this._flattened.length - 1) {
      this._selectPrevious();
    } else {
      this._selectNext();
    }

    this.items.delete(hash);
    this._flattened = this._flattened.filter(item => item.hash !== hash);
    this._flattened = this._sortItems(this._flattened);

    this._saveItemsLazily();

    this.render();
  }

  _sortItems(items) {
    return items.sort((a, b) => {
      return b.timestamp - a.timestamp;
    });
  }

  _select(offset) {
    if (this._selected) {
      const cur = this._flattened.indexOf(this._selected);
      const nxt = clamp(cur + offset, 0, this._flattened.length - 1);
      this._selected = this._flattened[nxt];

      if (cur === nxt) {
        return;
      }
    } else if (this._flattened.length > 0) {
      [this._selected] = this._flattened;
    }

    this.render();
  }

  _selectPrevious() {
    this._select(-1);
  }

  _selectNext() {
    this._select(1);
  }

  _selectItem() {
    const selected = this._selected;

    if (selected) {
      if (selected.type === 'image') {
        clipboard.write({
          image: nativeImage.createFromDataURL(selected.data.image),
          ...selected.data
        });
      } else {
        clipboard.write({
          ...selected.data
        });
      }
    }
  }

  _filterItems(pattern) {
    if (pattern) {
      // @TODO: Maybe use a better search algorithm
      try {
        const re = new RegExp(pattern, 'gim');
        const flattened = this._flattened.filter(item => {
          return item.type === 'text' && item.data.text.match(re);
        });

        this._selected = flattened[0];

        return [...flattened];
      } catch (e) {
        this._selected = this._flattened[0];
      }
    }

    if (!this._selected) {
      this._selected = this._flattened[0];
    }

    return [...this._flattened];
  }

  handleSearch(pattern) {
    if (pattern.length === 0) {
      this._pattern = null;
    } else {
      this._pattern = pattern;
    }

    this.render();
  }

  render() {
    const itemsToRender = this._filterItems(this._pattern);
    dispatch(EVENT.ITEM_RENDER, this._selected);

    if (itemsToRender.length > 0) {
      this.html`
        ${itemsToRender.map(item => wire(this, `:clippy-item-${item.hash}`)`
          <clippy-item
            data-hash="${item.hash}"
            data-type="${item.type}"
            class="${(this._selected && (item.hash === this._selected.hash)) ? 'selected' : ''}"
          >
            ${item.type === 'image' ? `Image: ${item.width}x${item.height}` : item.data.text.trim().substr(0, 100)}
          </clippy-item>
        `)}
      `;

      requestAnimationFrame(() => {
        const currentItem = this.querySelector('clippy-item.selected');
        if (currentItem) {
          this.scrollTop = currentItem.offsetTop - this.offsetHeight;
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
