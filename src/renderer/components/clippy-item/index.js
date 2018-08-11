import ClippyElement from '../clippy-element';
import './clippy-item.css';

class ClippyItem extends ClippyElement {
  connectedCallback() {
    this.setAttribute('role', 'listitem');
  }
}

customElements.define('clippy-item', ClippyItem);

export default ClippyItem;
