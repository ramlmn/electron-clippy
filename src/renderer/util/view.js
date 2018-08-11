/**
 * Used to check if a view should handle some event
 *
 * Usage:
 * ```
 * class App extends HTMLElement {
 *   connectedCallback() {
 *     document.addEventListner('keydown', event => {
 *       if (shouldHandle(this.view)) {
 *         // do something
 *       }
 *     });
 *   }
 *   show() {
 *     this.view = viewIn();
 *   }
 *   hide() {
 *     viewOut(this.view);
 *   }
 * }
 * ```
 */

const views = [];

// For debugging
window.views = views;

const shouldHandle = view => {
  return views[views.length - 1] === view;
};

const viewIn = (view = (Math.random() * 1e16).toString(36)) => {
  console.log('in:', view);

  views.push(view);
  return view;
};

const viewOut = view => {
  console.log('out:', view);

  if (shouldHandle(view)) {
    return views.pop();
  }

  return null;
};

export {
  viewIn,
  viewOut,
  shouldHandle
};
