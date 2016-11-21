(function () {
    "use strict";

    if (!window.customElements) {
        throw new Error('this browser does not support custom elements');
    }

    const PLAY_SYMBOL = '▶';
    const PAUSE_SYMBOL = '⏸';

    const STORAGE_NAME = 'bibli-naheulbeuk';
    const STORAGE_VERSION = 1;
    const STORAGE_COLLECTION_FILES = 'files';
    const STORAGE_COLLECTION_TIMES = 'times';
    const STORAGE_COLLECTIONS = [STORAGE_COLLECTION_FILES, STORAGE_COLLECTION_TIMES];

    class PlaylistItemElement extends HTMLElement {
        constructor() {
            super();

            this.audioPlayer = document.createElement('audio');

            initContent.call(this);
            initStorage.call(this).then(() => {
                if (!this.downloaded) {
                    initDownload.call(this);
                } else {
                    setPlayableControls.call(this);
                }
            });
        }

        play() {
            if (!this.downloaded) {
                throw new Error('trying to play a non downloaded playlist item');
            }

            if (!this.audioPlayer.src) {
                // TODO: on mobile, this does not work since we can only call
                // audio.play() on a user event:
                fetchAudioSource.call(this).then(this.play.bind(this));
                return;
            }

            this.paused = false;

            return this.audioPlayer.play().then(() => {
                this.playing = true;
                this.dispatchEvent(new CustomEvent('play'));
            });
        }

        pause() {
            this.playing = false;
            this.audioPlayer.pause();
            this.paused = true;
            this.dispatchEvent(new CustomEvent('pause'));
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

        get playing() {
            return this.hasAttribute('playing');
        }
        set playing(isPlaying) {
            this.playPauseButton.textContent = isPlaying ? PAUSE_SYMBOL : PLAY_SYMBOL;
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
            setBooleanAttributeValue.call(this, 'downloaded', isDownloaded);
        }
    }

    function initDownload() {
        this.ajaxDownload = new AjaxDownload.create(this.url);

        this.ajaxDownload.addEventListener('progress', () => {
            const progress = this.ajaxDownload.progress;
            if (!progress.computable) {
                return;
            }

            this.downloadProgressElt.setAttribute('value', progress.loaded);
            this.downloadProgressElt.setAttribute('max', progress.total);

        }, false);

        this.addEventListener('click', event => {
            if (!this.downloading && !this.downloaded) {
                const confirmMessage = getDownloadConfirmMessage.call(this);

                return confirmPopin(confirmMessage).then(confirmation => {
                    if (!confirmation || this.downloading || this.downloaded) {
                        return false;
                    }

                    this.downloading = true;
                    this.controls.innerHTML = '';
                    this.downloadProgressElt = document.createElement('progress');
                    this.controls.appendChild(this.downloadProgressElt);

                    return this.ajaxDownload.fetch().then(blob => {
                        return this.files.put(this.key, blob).then(() => {
                            this.downloading = false;
                            this.downloaded = true;

                            setPlayableControls.call(this);

                            return true;
                        });
                    });
                });
            }
        }, false);
    }

    function initStorage() {
        const storage = new Storage(STORAGE_NAME, STORAGE_VERSION, STORAGE_COLLECTIONS);

        return storage.open().then(() => {
            this.files = storage.getCollection(STORAGE_COLLECTION_FILES);
            this.times = storage.getCollection(STORAGE_COLLECTION_TIMES);

            return Promise.all([
                this.files.has(this.key).then(hasFile => this.downloaded = hasFile),
                this.times.fetch(this.key).then(time => {
                    if (time) {
                        this.audioPlayer.currentTime = time;
                    }
                })
            ]).then(() => {
                this.audioPlayer.addEventListener('timeupdate', event => {
                    this.times.put(this.key, this.audioPlayer.currentTime);
                    this.currentTimeElt.textContent = humanReadableTime(this.audioPlayer.currentTime);
                }, false);
            });
        });
    }

    function initContent() {
        this.attachShadow({ mode: 'open' });

        const main = document.createElement('main');

        const style = document.createElement('style');
        style.textContent = getStyle.call(this);
        main.appendChild(style);

        const heading = document.createElement('h1');
        heading.textContent = this.label;
        main.appendChild(heading);

        this.controls = document.createElement('section');
        // this.controls.textContent = "Cette saison n'est pas disponible à l'écoute car elle n'a pas encore été téléchargée ! Cliquez pour lancer le téléchargement.";

        main.appendChild(this.controls);

        this.shadowRoot.appendChild(main);
    }

    function setPlayableControls() {
        this.controls.innerHTML = '';

        this.playPauseButton = document.createElement('button');
        this.playPauseButton.textContent = PLAY_SYMBOL;
        this.playPauseButton.addEventListener('click', togglePlayPause.bind(this), false);

        this.currentTimeElt = document.createElement('span');
        this.currentTimeElt.classList.add('timedisplay');

        this.controls.appendChild(this.playPauseButton);
        this.controls.appendChild(this.currentTimeElt);
    }

    function togglePlayPause() {
        if (!this.playing) {
            this.play();
        } else {
            this.pause();
        }
    }

    function getStyle() {
        return `
main {
    padding-left: 10px;
}
h1 {
    font-size: 1.2em;
    font-weight: normal;
}
section {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
}
section :first-child {
    margin-right: 1em;
}
button {
    background: #CFD8DC;
    border: 1px solid #455A64;
    color: #455A64;
    font-size: 1.5em;
    height: 100%;
    outline: none;
    padding: 0.2em 0.5em;
}
.timedisplay {
    font-size: 1.9em;
}
`;
    }

    function getDownloadConfirmMessage() {
        return `Souhaitez-vous lancer le téléchargement de ce fichier ?

« ${this.label} »

Cette opération est déconseillée depuis les réseaux mobiles.`;
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
