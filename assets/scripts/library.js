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

    let playingItem = null;
    const playerElt = document.getElementById('player');
    const playlistElt = document.getElementById('playlist');
    const playlistItemTpl = document.getElementById('playlist-item');
    const playlistItemElts = [];
    const createPlaylistItemDocument = document.importNode.bind(document, playlistItemTpl.content, true);

    playerElt.addEventListener('timeupdate', (event) => {
        if (!playingItem) {
            return;
        }

        playingItem.currentTime = playerElt.currentTime;

        playlistStore.fetch(playingItem.id).then((record) => {
            record.currentTime = playingItem.currentTime;
            playlistStore.save(record);
        });
    }, false);

    playlistStore.open().then(run);

    function run() {
        const playlistItemsToDownload = [];

        Promise.all(playlist.map((playlistItem) => {
            return playlistStore.fetch(playlistItem.id).then((record) => {
                if (!record) {
                    playlistItemsToDownload.push(playlistItem);
                    return;
                }

                displayPlaylistItem(playlistItem);
            });
        })).then(() => {
            if (!playlistItemsToDownload.length) {
                return;
            }

            if (!confirm(
                "Souhaitez-vous lancer le téléchargement des fichiers suivants ?\n" +
                playlistItemsToDownload.map((playlistItem) => "\t- " + playlistItem.label).join('\n') +
                "\nIl est déconseillé de lancer ce téléchargement depuis une connexion mobile."
            )) {
                return;
            }

            playlistItemsToDownload.forEach((playlistItem) => {
                downloadPlaylistItem(playlistItem).then((blob) => {
                    const record = {
                        id: playlistItem.id,
                        blob: blob,
                        currentTime: 0,
                    };

                    playlistStore.save(record).then(() => {
                        displayPlaylistItem(playlistItem);
                    });
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

        playlistItemElts.push(playlistItemElt);
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
        if (playlistItemElt.classList.contains('playing')) {
            playlistItemElt.classList.remove('playing');
            playlistItemElt.classList.add('paused');
            playerElt.pause();
            return;
        }

        if (playlistItemElt.classList.contains('paused')) {
            playlistItemElt.classList.remove('paused');
            playlistItemElt.classList.add('playing');
            playerElt.play();
            return;
        }

        const id = playlistItemElt.dataset.playlistItemId;
        const playlistItem = playlist.find((playlistItem) => playlistItem.id === id);

        if (playlistItem.objectUrl && typeof(playlistItem.currentTime) === 'number') {
            play(playlistItemElt, playlistItem);
            return;
        }

        playlistStore.fetch(playlistItem.id).then((record) => {
            playlistItem.objectUrl = window.URL.createObjectURL(record.blob);
            playlistItem.currentTime = record.currentTime;
            play(playlistItemElt, playlistItem);
        });
    }

    function play(playlistItemElt, playlistItem) {
        playlistItemElts.forEach((playlistItemElt) => {
            playlistItemElt.classList.remove('playing');
            playlistItemElt.classList.remove('paused');
        });

        playlistItemElt.classList.add('playing')

        playerElt.src = playlistItem.objectUrl;
        playerElt.currentTime = playlistItem.currentTime;
        playerElt.play();
        playingItem = playlistItem;
    }
}());
