(function () {
    "use strict";

    if (!'customElements' in window) {
        throw new Error('this browser does not support the custom elements');
    }

    const DATABASE = new Store.Db('bibli-naheulbeuk', 1);

    const FILE_STORAGE_OBJECT_STORE = new Store.ObjectStore(
        'file-storage',
        { keyPath: 'key' },
        [new Store.Index('key', { unique: true })]
    );

    class PlaylistElement extends HTMLElement {
        constructor() {
            super();

            this.style.display = 'flex';
            this.style.flexDirection = 'column';

            this.audioPlayer = document.createElement('audio');
            this.downloader = new AjaxDownloader();
            this.fileStorage = new Store(DATABASE, FILE_STORAGE_OBJECT_STORE);

            this.fileStorage.open().then(() => {
                Promise.all(Array.prototype.map.call(this.children, item => {
                    this.fileStorage.fetch(item.key).then(record => {
                        item.downloaded = !!record;
                    });
                })).then(this.addEventListener.bind(this, 'click', this.handleClick, false));
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
                return this.fileStorage.save({ key: item.key, value: blob }).then(() => {
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
                this.audioPlayer.src = item.src;
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

                this.fileStorage.fetch(item.key).then(record => {
                    item.src = window.URL.createObjectURL(record.value);
                    resolve();
                    return;
                }, reject);
            });
        }
    }

    window.customElements.define('bbnh-playlist', PlaylistElement);
}());
