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
                if (!this.item) {
                    this.main.appendChild(this.playPauseButton);
                    this.main.appendChild(this.timeDisplay);
                }

                if (this.item && this.item.playing) {
                    this.item.pause();
                }

                this.item = event.target.selectedItem;
                this.togglePlayPause();

                this.item.addEventListener('timeupdate', event => {
                    const time = humanReadableTime(this.item.currentTime) + ' sur ' + humanReadableTime(this.item.duration);
                    this.timeDisplay.textContent = time;
                }, false);
            }, false);

            this.attachShadow({ mode: 'open' });
            this.main = document.createElement('main');
            const style = document.createElement('style');
            style.textContent = `
main {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    background: #607D8B;
}

main > button,
main > span {
    border: 1px solid #455A64;
    padding: 0.2em 0.5em;
    background: #CFD8DC;
    color: #455A64;
    height: 100%;
}

button {
    border: none;
    outline: none;
    font-size: 1.5em;
}
            `;

            this.playPauseButton = document.createElement('button');
            this.playPauseButton.textContent = PLAY_SYMBOL;
            this.playPauseButton.addEventListener('click', this.togglePlayPause.bind(this), false);

            this.timeDisplay = document.createElement('span');

            this.main.appendChild(style);
            this.shadowRoot.appendChild(this.main);
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

    function humanReadableTime(timeInSeconds) {
        let result = '';
        let seconds = Math.round(timeInSeconds);

        const hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;

        const minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;

        if (hours) {
            result += hours + 'h ';
        }

        if (minutes) {
            result += minutes + 'm ';
        }

        result += seconds + 's';

        return result;
    }

    window.customElements.define('bbnh-player', PlayerElement);
}());
