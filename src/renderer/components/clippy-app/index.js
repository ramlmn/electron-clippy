import {dispatch} from 'global-dispatcher';
import ClippyElement from '../clippy-element';
import {viewIn, shouldHandle} from '../../util/view';
import '../clippy-settings';
import '../clippy-search';
import '../clippy-button';
import '../clippy-items';
import '../clippy-previewer';
import './clippy-app.css';

class ClippyApp extends ClippyElement {
  constructor() {
    super();

    if (process.platform === 'linux') {
      this.classList.add('is-linux');
    }

    this.render();
  }

  set view(v) {
    this._view = v;
    return this._view;
  }

  get view() {
    return this._view;
  }

  connectedCallback() {
    this._view = viewIn();

    document.addEventListener('keydown', event => {
      if (!shouldHandle(this.view)) {
        return;
      }

      if (event.key === 'ArrowDown') {
        dispatch('next-item');
      } else if (event.key === 'ArrowUp') {
        dispatch('previous-item');
      } else if (event.key === 'Delete') {
        dispatch('delete-item');
      } else if (event.key === 'Enter') {
        dispatch('select-item');
      } else if (event.key === 'Escape') {
        dispatch('hide-window');
      }
    });
  }

  render() {
    this.html`
      <clippy-settings hidden></clippy-settings>
      <div class="clippy-toolbar">
        <clippy-search view="${this._view}"></clippy-search>
        <clippy-button
          icon="settings" label="Show app settings"
          onclick="${() => dispatch('show-settings')}"></clippy-button>
      </div>
      <div class="clippy-content">
        <clippy-items></clippy-items>
        <clippy-previewer></clippy-previewer>
      </div>
    `;
  }
}

customElements.define('clippy-app', ClippyApp);

export default ClippyApp;
