window.TRACKS = [
{file: 'donjon-de-naheulbeuk01.mp3', label: 'Épisode 01'},
{file: 'donjon-de-naheulbeuk02.mp3', label: 'Épisode 02'},
{file: 'donjon-de-naheulbeuk03.mp3', label: 'Épisode 03'},
{file: 'donjon-de-naheulbeuk04.mp3', label: 'Épisode 04'},
{file: 'donjon-de-naheulbeuk05.mp3', label: 'Épisode 05'},
{file: 'donjon-de-naheulbeuk06.mp3', label: 'Épisode 06'},
{file: 'donjon-de-naheulbeuk07.mp3', label: 'Épisode 07'},
{file: 'donjon-de-naheulbeuk08.mp3', label: 'Épisode 08'},
{file: 'donjon-de-naheulbeuk09.mp3', label: 'Épisode 09'},
{file: 'donjon-de-naheulbeuk10.mp3', label: 'Épisode 10'},
{file: 'donjon-de-naheulbeuk11.mp3', label: 'Épisode 11'},
{file: 'donjon-de-naheulbeuk12.mp3', label: 'Épisode 12'},
{file: 'donjon-de-naheulbeuk13.mp3', label: 'Épisode 13'},
{file: 'donjon-de-naheulbeuk14.mp3', label: 'Épisode 14'},
{file: 'donjon-de-naheulbeuk15.mp3', label: 'Épisode 15'},
{file: 'donjon-de-naheulbeuk16.mp3', label: 'Épisode 16'},
{file: 'donjon-de-naheulbeuk17.mp3', label: 'Épisode 17'},
{file: 'donjon-de-naheulbeuk18.mp3', label: 'Épisode 18'},
{file: 'donjon-de-naheulbeuk19.mp3', label: 'Épisode 19'},
{file: 'donjon-de-naheulbeuk20.mp3', label: 'Épisode 20'},
{file: 'donjon-de-naheulbeuk21-1.mp3', label: 'Épisode 21-1'},
{file: 'donjon-de-naheulbeuk21-2.mp3', label: 'Épisode 21-2'},
{file: 'donjon-de-naheulbeuk22.mp3', label: 'Épisode 22'},
{file: 'donjon-de-naheulbeuk23.mp3', label: 'Épisode 23'},
{file: 'donjon-de-naheulbeuk24.mp3', label: 'Épisode 24'},
{file: 'donjon-de-naheulbeuk25.mp3', label: 'Épisode 25'},
{file: 'donjon-de-naheulbeuk26-1.mp3', label: 'Épisode 26-1'},
{file: 'donjon-de-naheulbeuk26-2.mp3', label: 'Épisode 26-2'},
{file: 'donjon-de-naheulbeuk27-1.mp3', label: 'Épisode 27-1'},
{file: 'donjon-de-naheulbeuk27-2.mp3', label: 'Épisode 27-2'},
{file: 'donjon-de-naheulbeuk28.mp3', label: 'Épisode 28'},
{file: 'donjon-de-naheulbeuk29.mp3', label: 'Épisode 29'},
{file: 'donjon-de-naheulbeuk30-1.mp3', label: 'Épisode 30-1'},
{file: 'donjon-de-naheulbeuk30-2.mp3', label: 'Épisode 30-2'},
];
(function (exports) {
    "use strict";

    if (!exports.TRACKS) {
        throw new Error('TRACKS is undefined');
    }

    const playlist = document.querySelector('cgop-playlist');

    exports.TRACKS.forEach(track => {
        const trackElt = document.createElement('cgop-track');

        trackElt.setAttribute('key', track.file);
        trackElt.setAttribute('label', track.label);
        trackElt.setAttribute('url', `assets/audio/${track.file}`);

        playlist.appendChild(trackElt);
    });
}(window));
(function (exports) {
    "use strict";

    class EventTarget extends HTMLElement {
    }
    window.customElements.define('event-target', EventTarget);

    class EventEmitter {
        constructor() {
            this._eventTarget = new EventTarget();
        }

        addEventListener() {
            return this._eventTarget.addEventListener.apply(this._eventTarget, arguments);
        }

        removeEventListener() {
            return this._eventTarget.removeEventListener.apply(this._eventTarget, arguments);
        }

        dispatchEvent() {
            return this._eventTarget.dispatchEvent.apply(this._eventTarget, arguments);
        }
    }

    exports.EventEmitter = EventEmitter;
}(window));
(function (exports) {
    "use strict";

    class DownloadProgress extends CustomEvent {
        constructor() {
            super('progress');
        }
    }

    class AjaxDownload extends EventEmitter {
        constructor(url) {
            super();

            this._url = url;

            this.progress = {
                computable: null,
                loaded: 0,
                total: null,
            };
        }

        fetch() {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.addEventListener('progress', downloadProgressHandler.bind(this));
                xhr.addEventListener('load', downloadCompleteHandler.bind(this, resolve, reject));
                xhr.addEventListener('error', downloadFailedHandler.bind(this, resolve, reject));
                xhr.addEventListener('abort', downloadCanceledHandler.bind(this, resolve, reject));

                xhr.open('GET', this._url, true);
                xhr.responseType = 'blob';

                xhr.send();
            });
        }
    }

    function downloadProgressHandler(event) {
        this.progress.computable = event.lengthComputable;
        this.progress.loaded = event.loaded;
        this.progress.total = event.total;

        this.dispatchEvent(new DownloadProgress());
    }

    function downloadCompleteHandler(resolve, reject, event) {
        const xhr = event.target;

        if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(`could not download file at '${this._url}': ${xhr.status} (${xhr.statusText})`));
            return;
        }

        resolve(xhr.response);
    }

    function downloadFailedHandler(resolve, reject, event) {
        reject(new Error('download failed'));
    }

    function downloadCanceledHandler(resolve, reject, event) {
        reject(new Error('download canceled'));
    }

    exports.AjaxDownload = AjaxDownload;
}(window));
(function (exports) {
    "use strict";

    const TRANSACTION_TYPE_READONLY = 'readonly';
    const TRANSACTION_TYPE_READWRITE = 'readwrite';

    class Collection {
        constructor(dbHandler, name) {
            this.dbHandler = dbHandler;
            this.name = name;
        }

        put(key, value) {
            return new Promise((resolve, reject) => {
                const transaction = this.dbHandler.transaction([this.name], TRANSACTION_TYPE_READWRITE);
                const objectStore = transaction.objectStore(this.name);
                const request = objectStore.put({ key: key, value: value });

                request.onerror = event => {
                    reject(event.target.error);
                };
                request.onsuccess = event => {
                    resolve();
                };
            });
        }

        fetch(key) {
            return new Promise((resolve, reject) => {
                const transaction = this.dbHandler.transaction([this.name], TRANSACTION_TYPE_READONLY);
                const objectStore = transaction.objectStore(this.name);
                const request = objectStore.get(key);

                request.onerror = event => {
                    reject(event.target.error);
                };
                request.onsuccess = event => {
                    let value;

                    if (event.target.result) {
                        value = event.target.result.value;
                    }

                    resolve(value);
                };
            });
        }

        has(key) {
            return this.fetch(key).then(value => typeof(value) !== 'undefined');
        }
    }

    class Storage {
        constructor(name, version, collectionNames) {
            this.dbHandler = null;
            this.name = name;
            this.version = version;
            this.collectionNames = collectionNames;

            this.collections = {};
        }

        open() {
            return new Promise((resolve, reject) => {
                const request = window.indexedDB.open(this.name, this.version);

                request.onupgradeneeded = event => {
                    const dbHandler = event.target.result;

                    this.collectionNames.forEach(collectionName => {
                        if (dbHandler.objectStoreNames.contains(collectionName)) {
                            return;
                        }

                        const objectStore = dbHandler.createObjectStore(collectionName, { keyPath: 'key' });
                        objectStore.createIndex('key', 'key', { unique: true });
                    });
                }

                request.onsuccess = event => {
                    this.dbHandler = event.target.result;
                    resolve();
                };
                request.onerror = event => {
                    reject(event.target.error);
                };
            });
        }

        getCollection(name) {
            if (!this.collections[name]) {
                this.collections[name] = new Collection(this.dbHandler, name);
            }

            return this.collections[name];
        }
    }

    exports.Storage = Storage;
}(window));
(function () {
    "use strict";

    if (!window.customElements) {
        throw new Error('this browser does not support custom elements');
    }

    class PlaylistElement extends HTMLElement {
        constructor() {
            super();

            this.currentTrack = null;

            this.addEventListener('play', event => {
                const currentTrack = event.target;

                if (this.currentTrack && this.currentTrack !== currentTrack) {
                    this.currentTrack.pause();
                }

                this.currentTrack = currentTrack;
            }, true);
        }
    }

    window.customElements.define('cgop-playlist', PlaylistElement);
}());
(function () {
    "use strict";

    if (!window.customElements) {
        throw new Error('this browser does not support custom elements');
    }

    const CONFIRM_DOWNLOAD_TPL_ATTR_NAME = 'confirm-download-tpl';

    const PLAY_SYMBOL = '▶';
    const PAUSE_SYMBOL = '⏸';

    const STORAGE_NAME = 'cgop-tracks';
    const STORAGE_VERSION = 1;
    const STORAGE_COLLECTION_FILES = 'files';
    const STORAGE_COLLECTION_TIMES = 'times';
    const STORAGE_COLLECTIONS = [STORAGE_COLLECTION_FILES, STORAGE_COLLECTION_TIMES];

    const STATE_CONSTRUCTED = 'constructed';
    const STATE_INITIALIZED = 'initialized';
    const STATE_PENDING_DOWNLOAD = 'pending-download';
    const STATE_DOWNLOADING = 'downloading';
    const STATE_DOWNLOADED = 'downloaded';
    const STATE_LOADING = 'loading';
    const STATE_PLAYING = 'playing';
    const STATE_PAUSED = 'paused';
    const STATES = [STATE_CONSTRUCTED, STATE_INITIALIZED, STATE_PENDING_DOWNLOAD, STATE_DOWNLOADING, STATE_DOWNLOADED, STATE_LOADING, STATE_PLAYING, STATE_PAUSED];

    class TrackElement extends HTMLElement {
        constructor() {
            super();
            setState.call(this, 'constructed');

            this.audioPlayer = document.createElement('audio');

            initContent.call(this);

            initStorage.call(this).then(() => {
                if (!this.downloaded) {
                    initDownload.call(this);
                }
            });
        }

        play() {
            if (!this.audioPlayer.src) {
                throw new Error('trying to play a track which does not have any "src" attribute');
            }

            setState.call(this, STATE_LOADING);

            return this.audioPlayer.play().then(() => {
                setState.call(this, STATE_PLAYING);
                this.playPauseButton.textContent = PAUSE_SYMBOL;
                this.dispatchEvent(new CustomEvent('play'));
            });
        }

        pause() {
            this.audioPlayer.pause();
            setState.call(this, STATE_PAUSED);
            this.playPauseButton.textContent = PLAY_SYMBOL;
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

        get pendingDownload() {
            return this.hasAttribute(STATE_PENDING_DOWNLOAD);
        }

        get downloading() {
            return this.hasAttribute(STATE_DOWNLOADING);
        }

        get downloaded() {
            return this.hasAttribute(STATE_DOWNLOADED);
        }

        get playing() {
            return this.hasAttribute(STATE_PLAYING);
        }

        get paused() {
            return this.hasAttribute(STATE_PAUSED);
        }
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

        this.downloadProgressElt = document.createElement('progress');
        this.downloadProgressElt.classList.add('dl-progressbar');

        this.playPauseButton = document.createElement('button');
        this.playPauseButton.textContent = PLAY_SYMBOL;
        this.playPauseButton.addEventListener('click', togglePlayPause.bind(this), false);

        this.currentTimeElt = document.createElement('span');
        this.currentTimeElt.classList.add('timedisplay');

        main.appendChild(this.controls);

        this.shadowRoot.appendChild(main);
    }

    function initStorage() {
        const storage = new Storage(STORAGE_NAME, STORAGE_VERSION, STORAGE_COLLECTIONS);

        return storage.open().then(() => {
            this.files = storage.getCollection(STORAGE_COLLECTION_FILES);
            this.times = storage.getCollection(STORAGE_COLLECTION_TIMES);
            setState.call(this, STATE_INITIALIZED);

            return this.files.fetch(this.key).then(blob => {
                if (!blob) {
                    setState.call(this, STATE_PENDING_DOWNLOAD);
                    return;
                }

                setUpAudioPlayer.call(this, blob);
            });
        });
    }

    function initDownload() {
        this.ajaxDownload = new AjaxDownload(this.url);

        this.ajaxDownload.addEventListener('progress', () => {
            const progress = this.ajaxDownload.progress;
            if (!progress.computable) {
                return;
            }

            this.downloadProgressElt.setAttribute('value', progress.loaded);
            this.downloadProgressElt.setAttribute('max', progress.total);
        }, false);

        this.addEventListener('click', event => {
            if (!this.pendingDownload) {
                return;
            }

            confirmPopin.call(this).then(confirmation => {
                if (!confirmation || !this.pendingDownload) {
                    return;
                }

                setState.call(this, STATE_DOWNLOADING);

                this.controls.innerHTML = '';
                this.controls.appendChild(this.downloadProgressElt);

                this.ajaxDownload.fetch().then(blob => {
                    this.files.put(this.key, blob).then(() => setUpAudioPlayer.call(this, blob));
                });
            });
        }, false);
    }

    function setUpAudioPlayer(blob) {
        this.audioPlayer.src = window.URL.createObjectURL(blob);

        this.audioPlayer.addEventListener('timeupdate', event => {
            this.times.put(this.key, this.audioPlayer.currentTime);
            this.currentTimeElt.textContent = humanReadableTime(this.audioPlayer.currentTime) + ' / ' + humanReadableTime(this.audioPlayer.duration);;
        }, false);

        return this.times.fetch(this.key).then(time => {
            if (time) {
                this.audioPlayer.currentTime = time;
            }
            setPlayableControls.call(this);
            setState.call(this, STATE_DOWNLOADED);
        });
    }

    function setPlayableControls() {
        this.controls.innerHTML = '';
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
.dl-progressbar {
    border: 1px solid var(--secondary-color, black);
    width: 100%;
}
.dl-progressbar::-webkit-progress-bar {
    background: transparent;
}
.dl-progressbar::-webkit-progress-value {
    background: var(--secondary-color, black);
}
.dl-progressbar::-moz-progress-bar {
    background: var(--secondary-color, black);
}

button {
    background: var(--text-color);
    border: 1px solid var(--secondary-color, black);
    color: var(--main-color);
    font-size: 1.5em;
    height: 100%;
    outline: none;
    padding: 0.2em 0.5em;
}
.timedisplay {
    font-size: 1.6em;
    white-space: nowrap;
}
`;
    }

    function buildDownloadConfirmMessageBox() {
        const tplSelector = (
            trimmedAttributeValue.call(this, CONFIRM_DOWNLOAD_TPL_ATTR_NAME) ||
            trimmedAttributeValue.call(this.parentElement, CONFIRM_DOWNLOAD_TPL_ATTR_NAME)
        );

        if (!tplSelector) {
            return null;
        }

        const messageBoxTpl = document.querySelector(tplSelector);
        if (!messageBoxTpl) {
            throw new Error(`could not find confirm download template with selector: "${tplSelector}"`);
        }

        const messageBoxFragment = document.importNode(messageBoxTpl.content, true);
        Array.from(messageBoxFragment.querySelectorAll('.track-label')).forEach(elt => elt.textContent = this.label);

        return messageBoxFragment.firstElementChild;
    }

    function confirmPopin() {
        let messageBox;

        try {
            messageBox = buildDownloadConfirmMessageBox.call(this);
        } catch (error) {
            return Promise.reject(error);
        }

        if (!messageBox) {
            return Promise.resolve(true);
        }

        return new Promise(resolve => {
            messageBox.classList.add('cgop-download-confirm-popin');
            messageBox.style.position = 'fixed';

            messageBox.addEventListener('click', event => {
                if (event.target.classList.contains('confirm')) {
                    document.body.removeChild(messageBox);
                    resolve(true);
                }
                if (event.target.classList.contains('cancel')) {
                    document.body.removeChild(messageBox);
                    resolve(false);
                }
            });

            document.body.appendChild(messageBox);
            messageBox.style.top = 'calc(50vh - ' + (messageBox.clientHeight / 2) + 'px)';
            messageBox.style.left = 'calc(50vw - ' + (messageBox.clientWidth / 2) + 'px)';
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

    function setState(newState) {
        STATES.forEach(state => setBooleanAttributeValue.call(this, state, state === newState));
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

    const elementStyle = document.createElement('style');
    elementStyle.textContent = `
cgop-track {
  display: block;
  margin: 0;
  padding: 10px;
  transition: background-color 150ms ease-in-out;
}
cgop-track:not(:last-of-type) {
  border-bottom: 1px solid var(--secondary-color);
}

cgop-track[playing] {
  background-color: var(--main-color);
  color: var(--text-color);
}
`;
    document.body.appendChild(elementStyle);

    window.customElements.define('cgop-track', TrackElement);
}());
