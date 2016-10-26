(function () {
    "use strict";

    if (!'customElements' in window) {
        throw new Error('this browser does not support the custom elements');
    }

    class PlaylistElement extends HTMLElement {
        constructor() {
            super();

            this.style.display = 'flex';
            this.style.flexDirection = 'column';

            this.audioPlayer = document.createElement('audio');

            this.addEventListener('click', this.handleClick, false);
        }

        handleClick(event) {
            const clickedItem = event.target;

            if (this.playingItem) {
                this.playingItem.playing = false;
            }

            this.audioPlayer.src = clickedItem.url;
            this.audioPlayer.play();
            this.playingItem = clickedItem;
            this.playingItem.playing = true;
        }
    }

    window.customElements.define('bbnh-playlist', PlaylistElement);
}());
