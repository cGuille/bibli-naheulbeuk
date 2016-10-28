(function () {
    "use strict";

    if (!'customElements' in window) {
        throw new Error('this browser does not support the custom elements');
    }

    class PlaylistItemElement extends HTMLElement {
        constructor() {
            super();

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

            const notDownloadedWarning = document.createElement('span');
            notDownloadedWarning.textContent = "Cette saison n'est pas disponible à l'écoute car elle n'a pas encore été téléchargée !";

            heading.appendChild(label);
            heading.appendChild(notDownloadedWarning);

            const controls = document.createElement('section');

            this.currentTimeElt = document.createElement('span');
            controls.appendChild(this.currentTimeElt);

            main.appendChild(style);
            main.appendChild(heading);
            main.appendChild(controls);

            this.shadowRoot.appendChild(main);
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

            let displayValue = 'Lecture : ' + humanReadableTime(newValue);

            if (this.duration) {
                displayValue += ' sur ' + humanReadableTime(this.duration);
            }

            this.currentTimeElt.textContent = displayValue;
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
            setBooleanAttributeValue.call(this, 'downloaded', isDownloaded);
        }
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
