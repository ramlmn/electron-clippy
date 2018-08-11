import ClippyElement from '../clippy-element';
import './clippy-button.css';

class ClippyButton extends ClippyElement {
  connectedCallback() {
    this.role = 'button';
    this.tabIndex = 0;

    this._icon = this.getAttribute('icon');
    this._label = this.getAttribute('label');

    this.setAttribute('aria-label', this._label);

    this.addEventListener('mousedown', () => this._pressed());
    this.addEventListener('mouseup', () => this._released());

    this.addEventListener('keydown', event => {
      if (event.code === 'Space' || event.code === 'Enter') {
        this._pressed();
      }
    });

    this.addEventListener('keyup', event => {
      console.log(event);
      if (event.code === 'Space' || event.code === 'Enter') {
        this._released();
        this.dispatchEvent(new CustomEvent('click', {
          bubbles: false
        }));
      }
    });

    this.render();
  }

  _pressed() {
    this.setAttribute('aria-pressed', true);
  }

  _released() {
    this.setAttribute('aria-pressed', false);
  }

  render() {
    this.html`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
      </svg>
    `;
  }
}

customElements.define('clippy-button', ClippyButton);

export default ClippyButton;
