import {wire} from 'hyperhtml/esm';
import {subscribe} from '../../util/state';
import ClippyElement from '../clippy-element';
import './style.css';

class ClippyPreviewer extends ClippyElement {
  constructor() {
    super();

    subscribe('render-item', item => this.render(item));
  }

  connectedCallback() {
    this.render();
  }

  _getPreview(item) {
    if (item && item.type === 'image') {
      return wire()`<img class="preview-image" src="${item.thumb}">`;
    }

    return wire()`<div class="preview-text">${item ? item.data.text : ''}</div>`;
  }

  _getPreviewMeta(item) {
    if (!item) {
      return wire()`
        <p></p>
        <p></p>
      `;
    }

    return wire()`
      <p>Copied at <strong>${(new Date(item.timestamp)).toLocaleString()}</strong></p>
      <p>${item.type === 'image' ? wire()`<strong>${item.width}</strong> x <strong>${item.height}</strong>` : wire()`<strong>${[...item.data.text].length}</strong> chars`}</p>
    `;
  }

  render(item) {
    this.html`
      <div class="preview">
        ${this._getPreview(item)}
      </div>
      <div class="preview-meta">
        ${this._getPreviewMeta(item)}
      </div>
    `;
  }
}

customElements.define('clippy-previewer', ClippyPreviewer);

export default ClippyElement;
