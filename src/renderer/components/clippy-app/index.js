import ClippyElement from '../clippy-element';
import {dispatch} from '../../util/state';
import '../clippy-items';
import '../clippy-previewer';
import './style.css';

class ClippyApp extends ClippyElement {
  constructor() {
    super();

    if (process.platform === 'linux') {
      this.classList.add('is-linux');
    }

    document.addEventListener('keydown', event => {
      console.log(event);

      if (event.key === 'ArrowDown') {
        dispatch('next-item');
      } else if (event.key === 'ArrowUp') {
        dispatch('previous-item');
      } else if (event.key === 'Delete') {
        dispatch('delete-item');
      } else if (event.key === 'Enter') {
        dispatch('select-item');
      }
    });

    this.render();
  }

  render() {
    this.html`
      <clippy-toolbar></clippy-toolbar>
      <div class="clippy-content">
        <clippy-items></clippy-items>
        <clippy-previewer></clippy-previewer>
      </div>
    `;
  }
}

customElements.define('clippy-app', ClippyApp);

export default ClippyApp;
