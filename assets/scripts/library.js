(function () {
    "use strict";

    if (!'content' in document.createElement('template')) {
        throw new Error('this browser does not support the HTML template');
    }

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

    playlist.forEach((playlistItem) => {
        const playlistItemDocument = createPlaylistItemDocument();
        const playlistItemElt = playlistItemDocument.querySelector('.playlist-item');
        const labelElt = playlistItemDocument.querySelector('label');

        playlistItemElt.dataset.playlistItemId = playlistItem.id;
        labelElt.textContent = playlistItem.label;

        playlistItemElt.addEventListener('click', (event) => {
            handlePlaylistItemClick(event.currentTarget);
        }, false);

        playlistElt.appendChild(playlistItemDocument);
    });

    playlist.forEach(downloadPlaylistItem);

    function handlePlaylistItemClick(playlistItemElt) {
        console.log('handlePlaylistItemClick:', playlistItemElt);
    }

    function downloadPlaylistItem(playlistItem) {
        console.log('downloadPlaylistItem:', playlistItem);
    }
}());
