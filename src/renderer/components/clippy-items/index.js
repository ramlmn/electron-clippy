import {clipboard} from 'electron';
import {wire} from 'hyperhtml/esm';
import {clamp} from '../../util';
import {subscribe, dispatch} from '../../util/state';
import ClippyElement from '../clippy-element';
import '../clippy-item';
import './style.css';

class ClippyItems extends ClippyElement {
  constructor() {
    super();

    this.items = new Map();
    this._flattened = [];
    this._seleted = null;
    this.pattern = null;

    console.log(this);
  }

  connectedCallback() {
    this.role = 'list';

    subscribe('new-item', item => this.handleNewItem(item));
    subscribe('delete-item', hash => this.handleDeleteItem(hash));
    subscribe('search-item', pattern => this.handleSearch(pattern));

    subscribe('next-item', () => this._selectNext());
    subscribe('previous-item', () => this._selectPrevious());

    subscribe('select-item', () => this._selectItem());
  }

  handleNewItem(item) {
    if (this.items.has(item.hash)) {
      this._flattened = this._flattened.filter(i => i.hash !== item.hash);
    }

    this.items.set(item.hash, item);
    this._flattened.unshift(item);
    this._preSortItems();

    if (!this.pattern) {
      this._selected = item;
    }

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
    this._preSortItems();

    this.render();
  }

  _preSortItems() {
    this._flattened = this._flattened.sort((a, b) => {
      return b.timestamp - a.timestamp;
    });
  }

  _selectPrevious() {
    if (this._selected) {
      const cur = this._flattened.indexOf(this._selected);
      const prev = clamp(cur - 1, 0, this._flattened.length - 1);
      this._selected = this._flattened[prev];
    } else if (this._flattened.length > 0) {
      [this._selected] = this._flattened;
    }

    this.render();
  }

  _selectNext() {
    if (this._selected) {
      const cur = this._flattened.indexOf(this._selected);
      const next = clamp(cur + 1, 0, this._flattened.length - 1);
      this._selected = this._flattened[next];
    } else if (this._flattened.length > 0) {
      [this._selected] = this._flattened;
    }

    this.render();
  }

  _selectItem() {
    if (this._selected) {
      clipboard.write({...this._selected.data});
    }
  }

  _filterItems(pattern) {
    if (pattern) {
      try {
        const re = new RegExp(pattern, 'gim');
        const flattened = this._flattened.filter(item => {
          return item.type === 'text' && item.data.text.match(re);
        });

        return [...flattened];
      } catch (e) {}
    }

    return [...this._flattened];
  }

  handleSearch(pattern) {
    pattern = pattern.trim();

    if (pattern.length === 0) {
      this._pattern = pattern;
    } else {
      this._pattern = null;
    }

    this.render();
  }

  render() {
    const itemsToRender = this._filterItems(this._pattern);

    dispatch('render-item', this._selected);

    this.html`
      ${itemsToRender.map(item => wire(this, `:clippy-item-${item.hash}`)`
        <clippy-item
          data-hash="${item.hash}"
          data-type="${item.type}"
          class="${(item.hash === this._selected.hash) ? 'selected' : ''}"
        >
          ${item.type === 'image' ? `Image: ${item.width}x${item.height}` : item.data.text.trim().substr(0, 100)}
        </clippy-item>
      `)}
    `;
  }
}

customElements.define('clippy-items', ClippyItems);

export default ClippyItems;
