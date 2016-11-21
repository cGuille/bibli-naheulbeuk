(function () {
    "use strict";

    if (!window.customElements) {
        throw new Error('this browser does not support custom elements');
    }

    class PlaylistElement extends HTMLElement {
        constructor() {
            super();

            this.playingItem = null;

            this.addEventListener('play', event => {
                const playingItem = event.target;

                if (this.playingItem && this.playingItem !== playingItem) {
                    this.playingItem.pause();
                }

                this.playingItem = playingItem;
            }, true);
        }
    }

    window.customElements.define('bbnh-playlist', PlaylistElement);
}());
