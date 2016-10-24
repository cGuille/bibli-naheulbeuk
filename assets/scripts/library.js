(function () {
    "use strict";

    if (!'content' in document.createElement('template')) {
        throw new Error('this browser does not support the HTML template');
    }

    const DB_VERSION = 1;
    const DB_FILE_NAME = 'bibli-naheulbeuk';
    const DB_OBJECT_STORE_NAME = 'seasons-audio-library';
    const DB_OBJECT_STORE_KEYPATH = 'id';

    const playlistStore = new Store(
        new Store.Db(DB_FILE_NAME, DB_VERSION),
        new Store.ObjectStore(DB_OBJECT_STORE_NAME, { keyPath: DB_OBJECT_STORE_KEYPATH }, [new Store.Index(DB_OBJECT_STORE_KEYPATH, { unique: true })])
    );

    const playlist = [
        {
            id: 'saison1',
            label: "Saison 1 : Chez Zangdar",
            url: 'assets/library/donjon-de-naheulbeuk01-nextgen.mp3',
        }, {
            id: 'saison2',
            label: "Saison 2 : de Valtordu à Boulgourville",
            url: 'assets/library/donjon-de-naheulbeuk01-nextgen.mp3',
        },
    ];

    const playlistElt = document.getElementById('playlist');
    const playlistItemTpl = document.getElementById('playlist-item');
    const createPlaylistItemDocument = document.importNode.bind(document, playlistItemTpl.content, true);

    playlistStore.open().then(run);

    function run() {
        playlist.forEach((playlistItem) => {
            downloadPlaylistItem(playlistItem).then((blob) => {
                playlistStore.save({ id: playlistItem.id, blob: blob }).then(() => {
                    displayPlaylistItem(playlistItem)
                });
            });
        });
    }

    function displayPlaylistItem(playlistItem) {
        const playlistItemDocument = createPlaylistItemDocument();
        const playlistItemElt = playlistItemDocument.querySelector('.playlist-item');
        const labelElt = playlistItemDocument.querySelector('label');

        playlistItemElt.dataset.playlistItemId = playlistItem.id;
        labelElt.textContent = playlistItem.label;

        playlistItemElt.addEventListener('click', (event) => {
            handlePlaylistItemClick(event.currentTarget);
        }, false);

        playlistElt.appendChild(playlistItemDocument);
    }

    function downloadPlaylistItem(playlistItem) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.open('GET', playlistItem.url, true);
            xhr.responseType = 'blob';

            xhr.onload = (event) => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    return reject(new Error(`error while downloading playlist item ${JSON.stringify(playlistItem)}; responseText: ${xhr.responseText}; status: ${xhr.status}`));
                }

                return resolve(xhr.response);
            };

            xhr.send();
        });
    }

    function handlePlaylistItemClick(playlistItemElt) {
        console.log('handlePlaylistItemClick:', playlistItemElt);
    }
}());
