(function () {
    "use strict";

    if (!window.customElements) {
        throw new Error('this browser does not support custom elements');
    }

    const PLAY_SYMBOL = '▶';
    const PAUSE_SYMBOL = '⏸';

    class PlayerElement extends HTMLElement {
        constructor() {
            super();

            this.item = null;

            this.playlistElt.addEventListener('selected-item-change', event => {
                if (this.item && this.item.playing) {
                    this.item.pause();
                }

                this.item = event.target.selectedItem;
                this.togglePlayPause();
            }, false);

            this.attachShadow({ mode: 'open' });
            const main = document.createElement('main');
            const style = document.createElement('style');
            style.textContent = `
main {
    margin: 0;
    padding: 0;
}
            `;

            this.playPauseButton = document.createElement('button');
            this.playPauseButton.textContent = PLAY_SYMBOL;
            this.playPauseButton.addEventListener('click', this.togglePlayPause.bind(this), false);

            main.appendChild(style);
            main.appendChild(this.playPauseButton);
            this.shadowRoot.appendChild(main);
        }

        togglePlayPause() {
            if (!this.item) {
                return;
            }

            if (!this.item.downloaded) {
                this.item.download().then(downloaded => {
                    if (downloaded) {
                        this.togglePlayPause();
                    }
                });
                return;
            }

            if (this.item.playing) {
                this.item.pause();
                this.playPauseButton.textContent = PLAY_SYMBOL;
            } else {
                this.item.play();
                this.playPauseButton.textContent = PAUSE_SYMBOL;
            }
        }

        get playlistElt() {
            if (!this._playlistElt) {
                this._playlistElt = this.hasAttribute('playlist') ? getPlaylistFromAttribute.call(this) : getDefaultPlaylist.call(this);
            }

            return this._playlistElt;
        }
    }

    function getPlaylistFromAttribute() {
        const playlist = document.querySelector(this.getAttribute('playlist'));

        if (!playlist) {
            throw new Error(`could not retrieve playlist element from selector: '${this.getAttribute('playlist')}'`);
        }

        return playlist;
    }

    function getDefaultPlaylist() {
        const playlist = document.querySelector('bbnh-playlist');

        if (!playlist) {
            throw new Error(`could not find playlist element`);
        }

        return playlist;
    }

    window.customElements.define('bbnh-player', PlayerElement);
}());
