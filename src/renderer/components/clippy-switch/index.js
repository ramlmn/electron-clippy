import ClippyElement from '../clippy-element';
import './clippy-switch.css';
import {shouldHandle} from '../../util/view';

class ClippySwitch extends ClippyElement {
  connectedCallback() {
    // this.setAttribute('tabindex', 0);

    if (this.getAttribute('selected') === 'true') {
      this.checked = true;
    } else {
      this.checked = false;
    }

    this.addEventListener('keydown', event => {
      console.log(this.getAttribute('parentView'));

      if (!shouldHandle(this.getAttribute('parentView'))) {
        return;
      }

      if (event.code === 'Space' || event.code === 'Enter') {
        this.checked = !this.checked;
      }

      this.render();
    });

    this.render();
  }

  render() {
    this.html`
      <label class="switch-container" tabindex="0">
        <input
          type="checkbox" tabindex="-1"
          checked="${this.checked}"
          onchange="${() => this.dispatchEvent(new CustomEvent('change'))}">
        <span class="switch">
          <span class="track"></span>
          <span class="handle"></span>
        </span>
        <span class="switch-label">${this.getAttribute('label')}</span>
      </label>
    `;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    console.log(name, oldVal, newVal);

    if (name === 'selected') {
      if (newVal === 'true') {
        this.checked = true;
      } else {
        this.checked = false;
      }
    }
  }
}

customElements.define('clippy-switch', ClippySwitch);

export default ClippySwitch;
