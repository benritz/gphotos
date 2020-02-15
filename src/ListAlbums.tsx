import React, {useEffect} from "react"
import {useDispatch, useSelector} from 'react-redux'
import {Album, albumsList, AlbumsResult, AlbumsState} from "./albums";
import {State} from "./types";

const ListAlbums = () => {
    const albumsResult = useSelector<State, AlbumsResult>(state => state.albums);
    const dispatch = useDispatch();

    // auto load pages then use a button to load more
    const AUTO_LOAD_COUNT = 3;
    const listNext = () => { dispatch(albumsList(albumsResult.nextPageToken)) };
    const autoLoadNext = () => albumsResult.state === AlbumsState.MoreResults && albumsResult.numLoadedPages < AUTO_LOAD_COUNT;

    useEffect(() => {
        if (autoLoadNext()) {
            listNext();
        }
    });

    let stateMessage;

    switch (albumsResult.state) {
        case AlbumsState.Initial:
            break;
        case AlbumsState.Loading:
            stateMessage = <p>Loading your albums&hellip;</p>;
            break;
        case AlbumsState.MoreResults:
            console.log('MORE RESULTS');
            if (!autoLoadNext()) {
                stateMessage = <button onClick={listNext}>More&hellip;</button>;
            }
            break;
        case AlbumsState.Complete:
            if (albumsResult.albums.length === 0) {
                stateMessage = <p>You have no albums.</p>;
            }
            break;
        case AlbumsState.Error:
            stateMessage = <p>There was a problem listing your albums.</p>;
            break;
    }

    const listItems = albumsResult
        .albums
        .map((album: Album) => (<li key={album.id}>{album.title}</li>));

    return <div><ul className="ListAlbums">{listItems}</ul>{stateMessage}</div>
};

export default ListAlbums;
