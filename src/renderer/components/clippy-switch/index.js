import {shouldHandle} from '@ramlmn/view';
import ClippyElement from '../clippy-element';
import './clippy-switch.css';

class ClippySwitch extends ClippyElement {
  connectedCallback() {
    this.checked = this.getAttribute('selected');

    this.addEventListener('keydown', event => {
      if (!shouldHandle(this.getAttribute('parentView'))) {
        return;
      }

      if (event.code === 'Space' || event.code === 'Enter') {
        this.input.checked = !this.input.checked;
      }

      this.render();
    });

    this.render();
  }

  render() {
    this.html`
      <label class="switch-container" tabindex="0">
        <input onchange="${this.onchange}"
          type="checkbox" tabindex="-1"
          checked="${this.checked}">
        <span class="switch">
          <span class="track"></span>
          <span class="handle"></span>
        </span>
        <span class="switch-label">${this.getAttribute('label')}</span>
      </label>
    `;

    this.input = this.querySelector('input');
  }

  onchange(event) {
    event.preventDefault();
    event.stopPropagation();

    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true
    }));
  }
}

customElements.define('clippy-switch', ClippySwitch);

export default ClippySwitch;
