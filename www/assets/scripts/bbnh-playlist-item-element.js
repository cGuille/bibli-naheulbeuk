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
            this.ajaxDownload = new AjaxDownload.create(this.url);
            this.ajaxDownload.addEventListener('progress', () => {
                const progress = this.ajaxDownload.progress;
                if (!progress.computable) {
                    return;
                }

                if (!this.downloadProgressElt) {
                    this.downloadProgressElt = document.createElement('progress');
                    this.notDownloadedWarning.parentElement.replaceChild(this.downloadProgressElt, this.notDownloadedWarning);
                }

                this.downloadProgressElt.setAttribute('value', progress.loaded);
                this.downloadProgressElt.setAttribute('max', progress.total);

            }, false);

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
                    this.times.put(this.key, this.audioPlayer.currentTime);
                    this.dispatchEvent(new CustomEvent('timeupdate'));
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
                return this.ajaxDownload.fetch().then(blob => {
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
            return this.audioPlayer.currentTime;
        }
        set currentTime(newValue) {
            this.audioPlayer.currentTime = newValue;
        }

        get duration() {
            return this.audioPlayer.duration;
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
                if (this.notDownloadedWarning.parentElement) {
                    this.notDownloadedWarning.parentElement.removeChild(this.notDownloadedWarning);
                }
                if (this.downloadProgressElt) {
                    this.downloadProgressElt.parentElement.removeChild(this.downloadProgressElt);
                }
            }
            setBooleanAttributeValue.call(this, 'downloaded', isDownloaded);
        }
    }

    function fetchAudioSource() {
        return this.files.fetch(this.key).then(blob => {
            this.audioPlayer.src = window.URL.createObjectURL(blob);
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

    window.customElements.define('bbnh-playlist-item', PlaylistItemElement);
}());
