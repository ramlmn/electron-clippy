import {dispatch} from 'global-dispatcher';
import {viewIn, shouldHandle} from '@ramlmn/view';
import ClippyElement from '../clippy-element';
import {EVENT} from '../../../constants';
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

      if (event.code === 'ArrowDown') {
        dispatch(EVENT.ITEM_NEXT);
      } else if (event.code === 'ArrowUp') {
        dispatch(EVENT.ITEM_PREVIOUS);
      } else if (event.code === 'Delete') {
        dispatch(EVENT.ITEM_DELETE);
      } else if (event.code === 'Enter') {
        dispatch(EVENT.ITEM_SELECT);
      } else if (event.code === 'Escape') {
        dispatch(EVENT.APP_HIDE);
      }
    });
  }

  render() {
    this.html`
      <clippy-settings></clippy-settings>
      <div class="clippy-toolbar">
        <clippy-search autofocus="true" view="${this._view}"></clippy-search>
        <clippy-button
          icon="settings" label="Show app settings"
          onclick="${() => dispatch(EVENT.SETTINGS_SHOW)}"></clippy-button>
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
