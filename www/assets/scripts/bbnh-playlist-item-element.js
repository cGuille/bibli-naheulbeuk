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

    class PlaylistItemElement extends HTMLElement {
        constructor() {
            super();

            this.audioPlayer = document.createElement('audio');
            this.downloader = new AjaxDownloader();

            const storage = new Storage(STORAGE_NAME, STORAGE_VERSION, STORAGE_COLLECTIONS);
            storage.open().then(() => {
                this.files = storage.getCollection(STORAGE_COLLECTION_FILES);
                this.times = storage.getCollection(STORAGE_COLLECTION_TIMES);

                this.files.has(this.key).then(hasFile => this.downloaded = hasFile);
                this.times.fetch(this.key).then(time => {
                    if (time) {
                        this.currentTime = time;
                    }
                });

                this.audioPlayer.addEventListener('timeupdate', event => {
                    this.currentTime = this.audioPlayer.currentTime;
                    this.duration = this.audioPlayer.duration;
                    this.times.put(this.key, this.currentTime);
                }, false);
            });

            this.attachShadow({ mode: 'open' });

            const main = document.createElement('main');

            const style = document.createElement('style');
            style.textContent = `
main {
    padding-left: 10px;
}
h1 {
    display: flex;
    flex-wrap: wrap;
    font-size: 1em;
    font-weight: normal;
}
h1 label {
    font-size: 1.2em;
    min-width: 50%;
}
h1 span {
    font-size: 0.6em;
}
            `;

            const heading = document.createElement('h1');

            const label = document.createElement('label');
            label.textContent = this.label;

            this.notDownloadedWarning = document.createElement('span');
            this.notDownloadedWarning.textContent = "Cette saison n'est pas disponible à l'écoute car elle n'a pas encore été téléchargée ! Cliquez pour lancer le téléchargement.";

            heading.appendChild(label);
            heading.appendChild(this.notDownloadedWarning);

            const controls = document.createElement('section');

            this.currentTimeElt = document.createElement('span');
            controls.appendChild(this.currentTimeElt);

            main.appendChild(style);
            main.appendChild(heading);
            main.appendChild(controls);

            this.shadowRoot.appendChild(main);
        }

        play() {
            if (!this.downloaded) {
                throw new Error('trying to play a non downloaded playlist item');
            }

            if (!this.audioPlayer.src) {
                fetchAudioSource.call(this).then(this.play.bind(this));
                return;
            }

            this.paused = false;
            this.audioPlayer.play();
            this.playing = true;
        }

        pause() {
            this.playing = false;
            this.audioPlayer.pause();
            this.paused = true;
        }


        download() {
            const confirmMessage =`Souhaitez-vous lancer le téléchargement du fichier « ${this.label} » ?

    Cette opération est déconseillée depuis les réseaux mobiles.`;

            return confirmPopin(confirmMessage).then(confirmation => {
                if (!confirmation) {
                    return false;
                }

                this.downloading = true;
                return this.downloader.downloadFileAsBlob(this.url).then(blob => {
                    return this.files.put(this.key, blob).then(() => {
                        this.downloading = false;
                        this.downloaded = true;

                        return true;
                    });
                });
            });

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

        get currentTime() {
            return this.currentTimeValue || 0;
        }
        set currentTime(newValue) {
            this.currentTimeValue = newValue;
        }

        get selected() {
            return this.hasAttribute('selected');
        }
        set selected(isSelected) {
            setBooleanAttributeValue.call(this, 'selected', isSelected);
        }

        get playing() {
            return this.hasAttribute('playing');
        }
        set playing(isPlaying) {
            setBooleanAttributeValue.call(this, 'playing', isPlaying);
        }

        get paused() {
            return this.hasAttribute('paused');
        }
        set paused(isPaused) {
            setBooleanAttributeValue.call(this, 'paused', isPaused);
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
            if (isDownloaded) {
                this.notDownloadedWarning.parentElement.removeChild(this.notDownloadedWarning);
            }
            setBooleanAttributeValue.call(this, 'downloaded', isDownloaded);
        }
    }

    function fetchAudioSource() {
        return this.files.fetch(this.key).then(blob => {
            this.audioPlayer.src = window.URL.createObjectURL(blob);
            this.audioPlayer.currentTime = this.currentTime;
        });
    }

    function confirmPopin(message) {
        return new Promise(resolve => {
            setTimeout(() => resolve(window.confirm(message)), 0);
        });
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

    window.customElements.define('bbnh-playlist-item', PlaylistItemElement);
}());
