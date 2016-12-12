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
