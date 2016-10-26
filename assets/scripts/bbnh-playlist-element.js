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
            this.downloader = new AjaxDownloader();

            this.addEventListener('click', this.handleClick, false);
        }

        handleClick(event) {
            const clickedItem = event.target;

            if (!clickedItem.downloaded && this.confirmDownload(clickedItem)) {
                this.downloadAndPlay(clickedItem);
                return;
            }

            this.play(clickedItem);
        }

        confirmDownload(item) {
            return window.confirm(`Souhaitez-vous lancer le téléchargement du fichier « ${item.label} » ?

Cette opération est déconseillée depuis les réseaux mobiles.`);
        }

        downloadAndPlay(item) {
            this.download(item).then(this.play.bind(this, item));
        }


        download(item) {
            item.downloading = true;
            return this.downloader.downloadFileAsBlob(item.url).then(blob => {
                // TODO: store blob
                item.downloading = false;
                item.src = window.URL.createObjectURL(blob);
                item.downloaded = true;
            });
        }

        play(item) {
            if (this.playingItem) {
                this.playingItem.playing = false;
            }

            if (!item.src) {
                // TODO
                return;
            }

            this.audioPlayer.src = item.src;
            this.audioPlayer.play();
            this.playingItem = item;
            this.playingItem.playing = true;
        }
    }

    window.customElements.define('bbnh-playlist', PlaylistElement);
}());
