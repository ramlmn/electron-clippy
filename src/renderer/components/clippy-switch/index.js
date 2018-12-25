import ClippyElement from '../clippy-element';
import './clippy-switch.css';

class ClippySwitch extends ClippyElement {
  get view() {
    return this.dataset.view;
  }

  render() {
    this.html`
      <label class="switch-container">
        <input type="checkbox" checked="${this.selected}">
        <span class="switch">
          <span class="track"></span>
          <span class="handle"></span>
        </span>
        <span class="switch-label">${this.getAttribute('label')}</span>
      </label>
    `;

    this.input = this.querySelector('input');
  }

  attributeChangedCallback(attr, previousValue, currentValue) {
    if (attr === 'selected') {
      this.render();
    }
  }

  static get observedAttributes() {
    return ['selected'];
  }

  get selected() {
    return this.getAttribute('selected') === 'true';
  }

  set selected(value) {
    this.setAttribute('selected', value);
  }
}

customElements.define('clippy-switch', ClippySwitch);

export default ClippySwitch;
