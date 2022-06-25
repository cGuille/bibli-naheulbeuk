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
