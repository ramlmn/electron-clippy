import ClippyElement from '../clippy-element';
import {dispatch} from '../../util/state';
import './style.css';

class ClippyItem extends ClippyElement {
  connectedCallback() {
    this.setAttribute('role', 'listitem');
  }
}

customElements.define('clippy-item', ClippyItem);

export default ClippyItem;
