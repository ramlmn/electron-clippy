/**
 * Used to check if a view should handle some event
 *
 * Usage:
 * ```
 * class Modal extends HTMLElement {
 *   connectedCallback() {
 *     document.addEventListner('keydown', event => {
 *       if (shouldHandle(this.viewId)) {
 *         // do something
 *       }
 *     });
 *   }
 *
 *   show() {
 *     // guard for repeated `viewIn()` calls
 *     this.viewId = viewIn();
 *   }
 *
 *   hide() {
 *     viewOut(this.viewId);
 *   }
 * }
 * ```
 */

const views = [];

// For debugging
window.views = views;

const shouldHandle = viewId => {
  const lastView = views[views.length - 1];
  if (lastView && lastView.viewId === viewId) {
    return true;
  }

  return false;
};

const viewIn = (viewId = (Math.random() * 1e16).toString(36), update) => {
  views.push({viewId, update});
  return viewId;
};

const viewOut = viewId => {
  if (shouldHandle(viewId)) {
    const lastView = views.pop();
    if (lastView && lastView.update) {
      lastView.update();
    }
  }

  return null;
};

export {
  viewIn,
  viewOut,
  shouldHandle
};
