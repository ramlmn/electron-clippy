import {wire} from 'hyperhtml/esm';
import {subscribe} from 'global-dispatcher';
import ClippyElement from '../clippy-element';
import {EVENT} from '../../../constants';
import './clippy-previewer.css';

class ClippyPreviewer extends ClippyElement {
  constructor() {
    super();

    subscribe(EVENT.ITEM_RENDER, item => this.render(item));
  }

  connectedCallback() {
    this.render();
  }

  getPreviewTextOrImage(item) {
    if (item) {
      if (item.type === 'image') {
        return wire()`<img class="preview-image" src="${item.thumb}">`;
      }

      return wire()`<div class="preview-text">${item.data.text}</div>`;
    }

    return wire()`<div class="preview-text"></div>`;
  }

  getPreviewMeta(item) {
    if (item) {
      let meta;

      if (item.type === 'image') {
        meta = wire()`<strong>${item.width}</strong> x <strong>${item.height}</strong>`;
      } else {
        meta = wire()`<strong>${[...item.data.text].length}</strong> chars`;
      }

      return wire()`
        <p>Copied at <strong>${(new Date(item.timestamp)).toLocaleString()}</strong></p>
        <p>${meta}</p>
      `;
    }

    return wire()`
      <p></p>
      <p></p>
    `;
  }

  render(item) {
    this.html`
      <div class="preview">
        ${this.getPreviewTextOrImage(item)}
      </div>
      <div class="preview-meta">
        ${this.getPreviewMeta(item)}
      </div>
    `;
  }
}

customElements.define('clippy-previewer', ClippyPreviewer);

export default ClippyElement;
