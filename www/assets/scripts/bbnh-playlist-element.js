(function () {
    "use strict";

    if (!window.customElements) {
        throw new Error('this browser does not support custom elements');
    }

    const STORAGE_NAME = 'bibli-naheulbeuk';
    const STORAGE_VERSION = 1;
    const STORAGE_COLLECTION_FILES = 'files';
    const STORAGE_COLLECTION_TIMES = 'times';
    const STORAGE_COLLECTIONS = [STORAGE_COLLECTION_FILES, STORAGE_COLLECTION_TIMES];

    class PlaylistElement extends HTMLElement {
        constructor() {
            super();

            this.style.display = 'flex';
            this.style.flexDirection = 'column';

            this.audioPlayer = document.createElement('audio');
            this.downloader = new AjaxDownloader();

            const storage = new Storage(STORAGE_NAME, STORAGE_VERSION, STORAGE_COLLECTIONS);
            storage.open().then(() => {
                this.files = storage.getCollection(STORAGE_COLLECTION_FILES);
                this.times = storage.getCollection(STORAGE_COLLECTION_TIMES);

                Promise.all(Array.prototype.map.call(this.children, item => {
                    this.files.has(item.key).then(hasFile => item.downloaded = hasFile);
                })).then(this.addEventListener.bind(this, 'click', this.handleClick, false));

                this.audioPlayer.addEventListener('timeupdate', event => {
                    if (!this.playingItem) {
                        return;
                    }

                    this.playingItem.currentTime = this.audioPlayer.currentTime;
                    this.playingItem.duration = this.audioPlayer.duration;
                    this.times.put(this.playingItem.key, this.playingItem.currentTime);
                }, false);

                Array.prototype.forEach.call(this.children, item => {
                    this.times.fetch(item.key).then(itemTime => item.currentTime = itemTime || 0);
                });
            });
        }

        handleClick(event) {
            const clickedItem = event.target;

            if (!clickedItem.downloaded && this.confirmDownload(clickedItem)) {
                this.downloadAndPlay(clickedItem);
                return;
            }

            if (this.playingItem === clickedItem) {
                this.togglePause();
            } else {
                this.play(clickedItem);
            }
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
                return this.files.put(item.key, blob).then(() => {
                    item.downloading = false;
                    item.downloaded = true;
                });
            });
        }

        play(item) {
            if (this.playingItem) {
                this.playingItem.playing = false;
                this.playingItem.paused = false;
            }

            if (!item.downloaded) {
                return;
            }

            this.fetchItemSrc(item).then(() => {
                this.audioPlayer.pause();
                this.audioPlayer.src = item.src;
                this.audioPlayer.currentTime = item.currentTime;
                this.audioPlayer.play();
                this.playingItem = item;
                this.playingItem.playing = true;
            });
        }

        togglePause() {
            if (!this.playingItem) {
                return;
            }

            if (this.audioPlayer.paused) {
                this.audioPlayer.play();
            } else {
                this.audioPlayer.pause();
            }

            this.playingItem.playing = !this.playingItem.playing;
            this.playingItem.paused = !this.playingItem.paused;
        }

        fetchItemSrc(item) {
            return new Promise((resolve, reject) => {
                if (item.src) {
                    resolve();
                    return;
                }

                this.files.fetch(item.key).then(blob => {
                    item.src = window.URL.createObjectURL(blob);
                    resolve();
                }, reject);
            });
        }
    }

    window.customElements.define('bbnh-playlist', PlaylistElement);
}());
