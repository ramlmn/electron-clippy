(function() {
  'use strict';

  /**
   * A class which helps to trap user input inside an element
   *
   * @class TrapKeyboard
   */
  class TrapKeyboard {
    /**
     * Creates an instance of TrapKeyboard
     * @param {Node} element
     * @param {Object} [options={}]
     * @memberof TrapKeyboard
     */
    constructor(element, options = {}) {
      // Check if the element is a DOM node
      if (!(element.nodeType === 1)) {
        return new TypeError('Provide an ElementNode');
      }

      this._root = element;

      this._firstTabStop = null;
      this._lastTabStop = null;

      this._onKeyDown = this._onKeyDown.bind(this);
      this._onMutation = this._onMutation.bind(this);

      const observerOptions = Object.assign({}, {
        childList: true,
        attributes: true,
        subtree: true,
      }, options);

      // Add a MutationObserver to watch for DOM changes
      this.observer = new MutationObserver(this._onMutation);

      // Start the observer
      this.observer.observe(this._root, observerOptions);

      // Need to update on window resize if any CSS Media Queries might change
      // the visibility and display of focusable elements
      window.addEventListener('resize', this._onMutation);

      // Initial setup
      this._onMutation();
    }

    _onMutation() {
      // Get all the possible elements that the user can interact with
      const elements = Array.from(
        this._root.querySelectorAll(this.constructor.focusableElementsString)
      );

      // Get the focusible element from top bottom
      this._firstTabStop = this._getFocusibleElement(elements);
      // Get the focusible element from bottom up
      this._lastTabStop = this._getFocusibleElement(elements.reverse());
    }

    _getFocusibleElement(list) {
      // Find a 'focusible' element
      return list.find(element => {
        // Get the computed styles of the element
        const styles = getComputedStyle(element);

        // Check if the element is accessible
        // Not an ideal solution though
        if (!(styles.display === 'none') || !(styles.visibility === 'hidden')) {
          return true;
        } else {
          return false;
        }
      });
    }

    _onKeyDown(event) {
      // We need atleast two unique elements for it to work
      if (!(this._firstTabStop && this._lastTabStop)) {
        event.preventDefault();
        return;
      }

      // If we are on the last element transfer the focus to first element and vice versa
      // Check for TAB key press
      if (event.keyCode === 9) {
        // SHIFT + TAB
        if (event.shiftKey) {
          if (document.activeElement === this._firstTabStop) {
            // Traverse back
            event.preventDefault();
            this._lastTabStop.focus();
          }
        } else {
          // TAB
          if (document.activeElement === this._lastTabStop) {
            // Traverse forward
            event.preventDefault();
            this._firstTabStop.focus();
          }
        }
      }
    }

    /**
     * Trap the users keyboard, this effects until unTrap is called
     *
     * @memberof TrapKeyboard
     */
    trap() {
      // Add a keydown event
      this._root.addEventListener('keydown', this._onKeyDown);

      // Focus the first element, if any
      if (this._firstTabStop) {
        this._firstTabStop.focus();
      } else {
        this._root.focus();
      }
    }


    /**
     * Stop trapping the users keyboard
     *
     * @memberof TrapKeyboard
     */
    unTrap() {
      // Remove the event listeners
      this._root.removeEventListener('keydown', this._onKeyDown);
    }


    /**
     * CSS query string for possbile focusible elements
     *
     * @readonly
     * @static
     * @memberof TrapKeyboard
     */
    static get focusableElementsString() {
      // All possible focusable elements
      return [
        'a[href]',
        'area[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'datalist:not([disabled])',
        'iframe',
        'object',
        'embed',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable]',
      ].join();
    }
  }

  if (typeof module != 'undefined' && module.exports) {
    module.exports = TrapKeyboard;
  } else if (typeof define === 'function' && define.amd) {
    define('TrapKeyboard', [], function() {
      return TrapKeyboard;
    });
  } else {
    self.TrapKeyboard = TrapKeyboard;
  }
}());
