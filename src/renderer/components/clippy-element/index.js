import {bind, wire} from 'hyperhtml/esm';

class ClippyElement extends HTMLElement {
  constructor(...args) {
    super(...args);
    this.html = bind(this);
    this.wire = wire(this);
    this.state = {};
  }

  connectedCallback() {
    this.render();
  }

  render() {}

  setState(state, render) {
    const target = this.state;
    const source = typeof state === 'function' ? state.call(this, target) : state;

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }

    if (render !== false) {
      this.render();
    }

    return this;
  }
}

export default ClippyElement;
