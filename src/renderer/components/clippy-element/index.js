import {bind} from 'hyperhtml/esm';

class ClippyElement extends HTMLElement {
  constructor(...args) {
    super(...args);
    this.html = bind(this);
  }

  render() {}
}

export default ClippyElement;
