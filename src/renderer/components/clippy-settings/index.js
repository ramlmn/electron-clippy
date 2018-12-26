import {subscribe, dispatch} from 'global-dispatcher';
import {viewIn, viewOut, shouldHandle} from '@ramlmn/view';
import ClippyElement from '../clippy-element';
import {EVENT} from '../../../constants';
import '../clippy-switch';
import './clippy-settings.css';

class ClippySettings extends ClippyElement {
  constructor() {
    super();

    this._settings = {
      runOnStartup: false,
      persistentHistory: false
    };

    subscribe(EVENT.SETTINGS_SHOW, () => this.show());
    subscribe(EVENT.SETTINGS_HIDE, () => this.hide());
    subscribe(EVENT.SETTINGS_UPDATE, settings => this._onSettingsUpdate(settings));
  }

  connectedCallback() {
    this._visible = false;

    if (this.hasAttribute('visible')) {
      this.show();
    } else {
      this.hide();
    }

    document.addEventListener('keydown', event => {
      if (!shouldHandle(this.view)) {
        return;
      }

      if (event.code === 'Escape' && this._visible) {
        this.hide();
        event.preventDefault();
      }
    });

    this.render();
  }

  get view() {
    return this._view;
  }

  set view(view) {
    this._view = view;
    return this._view;
  }

  show() {
    if (this._visible) {
      return;
    }

    this.view = viewIn();

    requestAnimationFrame(() => {
      this._visible = true;
      this.classList.add('shown');
      this.removeAttribute('visible');
      this.setAttribute('aria-hidden', false);
    });
  }

  hide() {
    if (!this._visible) {
      return;
    }

    viewOut(this.view);

    requestAnimationFrame(() => {
      this._visible = false;
      this.classList.remove('shown');
      this.setAttribute('visible', true);
      this.setAttribute('aria-hidden', true);
    });
  }

  _onSettingsUpdate(settings) {
    this._settings = Object.assign({}, this._settings, settings);
    this.render();
  }

  _onSettingChange(setting, value) {
    this._settings[setting] = value;

    dispatch(EVENT.SETTINGS_CHANGE, this._settings);
  }

  render() {
    this.html`
      <div class="scrim" onclick="${() => dispatch(EVENT.SETTINGS_HIDE)}"></div>
      <div class="content">
        <h2>Settings</h2>
        <section>
          <clippy-switch
            name="runOnStartup" selected="${this._settings.runOnStartup}"
            onchange="${event => this._onSettingChange('runOnStartup', event.target.checked)}"
            label="Start Clippy on system startup"
            ></clippy-switch>
          <clippy-switch
            name="persistentHistory" selected="${this._settings.persistentHistory}"
            onchange="${event => this._onSettingChange('persistentHistory', event.target.checked)}"
            label="Persist clipboard history across restarts"
            ></clippy-switch>
        </section>
        <section>
          <button type="button" onclick="${() => dispatch(EVENT.ITEMS_CLEAR)}">Clear history</button>
        </section>
      </div>
    `;
  }
}

customElements.define('clippy-settings', ClippySettings);

export default ClippySettings;
