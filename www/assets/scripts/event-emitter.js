(function (exports) {
    "use strict";

    class EventTarget extends HTMLElement {
    }
    window.customElements.define('event-target', EventTarget);

    class EventEmitter {
        constructor() {
            this._eventTarget = new EventTarget();
        }

        addEventListener() {
            return this._eventTarget.addEventListener.apply(this._eventTarget, arguments);
        }

        removeEventListener() {
            return this._eventTarget.removeEventListener.apply(this._eventTarget, arguments);
        }

        dispatchEvent() {
            return this._eventTarget.dispatchEvent.apply(this._eventTarget, arguments);
        }
    }

    exports.EventEmitter = EventEmitter;
}(window));
