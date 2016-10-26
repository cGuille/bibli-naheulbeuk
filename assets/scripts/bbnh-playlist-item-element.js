(function () {
    "use strict";

    if (!'customElements' in window) {
        throw new Error('this browser does not support the custom elements');
    }

    class PlaylistItemElement extends HTMLElement {
        constructor() {
            super();

            this.attachShadow({ mode: 'open' });
            this.shadowRoot.innerHTML = `<label>${this.label}</label>`;
        }

        get key() {
            return trimmedAttributeValue.call(this, 'key');
        }

        get label() {
            return trimmedAttributeValue.call(this, 'label');
        }

        get url() {
            return trimmedAttributeValue.call(this, 'url');
        }

        get playing() {
            return this.hasAttribute('playing');
        }
        set playing(isPlaying) {
            setBooleanAttributeValue.call(this, 'playing', isPlaying);
        }

        get downloading() {
            return this.hasAttribute('downloading');
        }
        set downloading(isDownloading) {
            setBooleanAttributeValue.call(this, 'downloading', isDownloading);
        }

        get downloaded() {
            return this.hasAttribute('downloaded');
        }
        set downloaded(isDownloaded) {
            setBooleanAttributeValue.call(this, 'downloaded', isDownloaded);
        }
    }

    function trimmedAttributeValue(attributeName) {
        const attr = this.getAttribute(attributeName);
        return attr ? attr.trim() : null;
    }

    function setBooleanAttributeValue(attributeName, isEnabled) {
        if (isEnabled) {
            this.setAttribute(attributeName, '');
        } else {
            this.removeAttribute(attributeName);
        }
    }

    window.customElements.define('bbnh-playlist-item', PlaylistItemElement);
}());
