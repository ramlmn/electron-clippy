import {subscribe, dispatch} from 'global-dispatcher';
import {viewIn, viewOut, shouldHandle} from '../../util/view';
import ClippyElement from '../clippy-element';
import {EVENT} from '../../../constants';
import '../clippy-switch';
import './clippy-settings.css';

class ClippySettings extends ClippyElement {
  constructor() {
    super();

    this._settings = {};
  }

  connectedCallback() {
    subscribe(EVENT.SETTINGS_SHOW, () => this.show());
    subscribe(EVENT.SETTINGS_HIDE, () => this.hide());

    if (this.hasAttribute('visible')) {
      this.hide();
    } else {
      this.show();
    }

    document.addEventListener('keydown', event => {
      if (!shouldHandle(this.view)) {
        return;
      }

      if (event.code === 'Escape' && !this._visible) {
        this.hide();
        event.preventDefault();
      }
    });

    this.render();
  }

  get view() {
    return this._view;
  }

  set view(v) {
    this._view = v;
    return this._view;
  }

  set visible(value) {
    if (value === true) {
      this.hide();
    } else {
      this.show();
    }
  }

  get visible() {
    return this._visible;
  }

  show() {
    if (!this._visible) {
      return;
    }

    this.view = viewIn();

    requestAnimationFrame(() => {
      this._visible = false;
      this.classList.add('shown');
      this.removeAttribute('visible');
      this.setAttribute('aria-hidden', false);
    });
  }

  hide() {
    if (this._visible) {
      return;
    }

    viewOut(this.view);

    requestAnimationFrame(() => {
      this._visible = true;
      this.classList.remove('shown');
      this.setAttribute('visible', true);
      this.setAttribute('aria-hidden', true);
    });
  }

  static get observedAttributes() {
    return ['visible'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) {
      return;
    }

    if (name === 'visible') {
      if (this.hasAttribute('visible')) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  _onSettingChange(setting, value) {
    this._settings[setting] = value;

    dispatch(EVENT.SETTINGS_CHANGE, this._settings);

    this.render();
  }

  render() {
    this.html`
      <div class="scrim" onclick="${() => dispatch(EVENT.SETTINGS_HIDE)}"></div>
      <div class="content">
        <h2>Settings</h2>
        <clippy-switch
          name="startup" parentView="${this.view}"
          onchange="${event => this._onSettingChange('startup', event.target.value)}"
          selected="${Boolean(this._settings.startup)}"
          label="Start Clippy on system startup"
        ></clippy-switch>
      </div>
    `;
  }
}

customElements.define('clippy-settings', ClippySettings);

export default ClippySettings;
