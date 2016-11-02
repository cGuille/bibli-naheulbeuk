(function () {
    "use strict";

    if (!window.customElements) {
        throw new Error('this browser does not support custom elements');
    }

    class PlaylistElement extends HTMLElement {
        constructor() {
            super();

            this.selectedItem = null;

            this.addEventListener('click', event => {
                if (this.selectedItem) {
                    this.selectedItem.selected = false;
                }

                this.selectedItem = event.target;

                this.selectedItem.selected = true;
                this.dispatchEvent(new SelectedItemChangeEvent());
            }, true);
        }
    }

    class SelectedItemChangeEvent extends CustomEvent {
        constructor() {
            super('selected-item-change');
        }
    }

    window.customElements.define('bbnh-playlist', PlaylistElement);
}());
