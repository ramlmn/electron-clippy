import ClippyElement from '../clippy-element';
import './clippy-switch.css';

class ClippySwitch extends ClippyElement {
  connectedCallback() {
    this.setAttribute('tabindex', 0);

    this.addEventListener('keyup', event => {
      if (event.code === 'Space' || event.code === 'Enter') {
        this.selected = !this.selected;
      }
    });

    this.render();
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
