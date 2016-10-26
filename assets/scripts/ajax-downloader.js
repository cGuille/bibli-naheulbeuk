(function (exports) {
    "use strict";

    class AjaxDownloader {
        downloadFileAsBlob(url) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.open('GET', url, true);
                xhr.responseType = 'blob';

                xhr.onload = (event) => {
                    if (xhr.status < 200 || xhr.status >= 300) {
                        return reject(new Error(`could not download file at '${url}': ${xhr.status} (${xhr.statusText})`));
                    }

                    return resolve(xhr.response);
                };
                xhr.send();
            });
        }
    }

    exports.AjaxDownloader = AjaxDownloader;
}(window));
