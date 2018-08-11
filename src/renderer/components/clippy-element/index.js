import {bind} from 'hyperhtml/esm';

class ClippyElement extends HTMLElement {
  constructor(...args) {
    super(...args);
    this.html = bind(this);
  }

  connectedCallback() {
    this.render();
  }

  render() {}
}

export default ClippyElement;
