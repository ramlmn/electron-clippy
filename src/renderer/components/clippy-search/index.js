import {dispatch} from 'global-dispatcher';
import ClippyElement from '../clippy-element';
import {shouldHandle} from '../../util/view';
import './clippy-search.css';

class ClippySearch extends ClippyElement {
  constructor() {
    super();

    this._value = '';
  }

  connectedCallback() {
    this._autoFocus = this.getAttribute('autofocus') || false;

    if (this._autoFocus) {
      document.addEventListener('keyup', event => {
        if (!shouldHandle(this.view)) {
          return;
        }

        const input = this.querySelector('input');
        if (document.activeElement !== input && !event.defaultPrevented) {
          input.focus();
        }
      });
    }

    this.render();
  }

  get view() {
    return this.getAttribute('view');
  }

  onChange(event) {
    this._value = event.target.value;
    dispatch('search-item', this._value);
  }

  static get observedAttributes() {
    return ['autofocus'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'autofocus') {
      this._autoFocus = newVal;
      this.render();
    }
  }

  render() {
    this.html`
      <input type="search"
        oninput="${this.onChange}" onchange="${this.onChange}"
        value="${this._value}" autofocus="${this._autoFocus}"
        autocomplete="off" spellcheck="false"
        placeholder="Search">
    `;
  }
}

customElements.define('clippy-search', ClippySearch);

export default ClippySearch;
