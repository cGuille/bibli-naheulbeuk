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

        get downloading() {
            return this.hasAttribute('downloading');
        }
        set downloading(isDownloading) {
            if (isDownloading) {
                this.setAttribute('downloading', '');
            } else {
                this.removeAttribute('downloading');
            }
        }

        get downloaded() {
            return this.hasAttribute('downloaded');
        }
        set downloaded(isDownloaded) {
            if (isDownloaded) {
                this.setAttribute('downloaded', '');
            } else {
                this.removeAttribute('downloaded');
            }
        }
    }

    function trimmedAttributeValue(attributeValue) {
        const attr = this.getAttribute(attributeValue);
        return attr ? attr.trim() : null;
    }

    window.customElements.define('bbnh-playlist-item', PlaylistItemElement);
}());
