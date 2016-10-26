(function () {
    "use strict";

    if (!'customElements' in window) {
        throw new Error('this browser does not support the custom elements');
    }

    const DATABASE = new Storage.Db('bibli-naheulbeuk', 1);
    const DATA_STORES = [
        new Storage.ObjectStore('file', { keyPath: 'key' }, [new Storage.Index('key', { unique: true })]),
        new Storage.ObjectStore('time', { keyPath: 'key' }, [new Storage.Index('key', { unique: true })]),
    ];

    class PlaylistElement extends HTMLElement {
        constructor() {
            super();

            this.style.display = 'flex';
            this.style.flexDirection = 'column';

            this.audioPlayer = document.createElement('audio');
            this.downloader = new AjaxDownloader();
            this.storage = new Storage(DATABASE, DATA_STORES);

            this.storage.open().then(() => {
                Promise.all(Array.prototype.map.call(this.children, item => {
                    this.storage.store('file').fetch(item.key).then(record => {
                        item.downloaded = !!record;
                    });
                })).then(this.addEventListener.bind(this, 'click', this.handleClick, false));

                this.audioPlayer.addEventListener('timeupdate', event => {
                    if (!this.playingItem) {
                        return;
                    }

                    this.playingItem.currentTime = this.audioPlayer.currentTime;

                    this.storage.store('time').save({
                        key: this.playingItem.key,
                        value: this.playingItem.currentTime,
                    });
                }, false);

                Array.prototype.forEach.call(this.children, item => {
                    this.storage.store('time').fetch(item.key).then(record => {
                        if (!record) {
                            return;
                        }

                        item.currentTime = record.value;
                    });
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
                return this.storage.store('file').save({ key: item.key, value: blob }).then(() => {
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

                this.storage.store('file').fetch(item.key).then(record => {
                    item.src = window.URL.createObjectURL(record.value);
                    resolve();
                    return;
                }, reject);
            });
        }
    }

    window.customElements.define('bbnh-playlist', PlaylistElement);
}());
