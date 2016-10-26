(function () {
    "use strict";

    if (!'customElements' in window) {
        throw new Error('this browser does not support the custom elements');
    }

    class PlaylistItemElement extends HTMLElement {

    }

    window.customElements.define('bbnh-playlist-item', PlaylistItemElement);
}());
