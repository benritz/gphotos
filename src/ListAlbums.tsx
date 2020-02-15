import React, {useEffect} from "react"
import {useDispatch, useSelector} from 'react-redux'
import {createSelector} from "reselect"

import {Album, albumsList, AlbumsResult, AlbumsState} from "./albums"
import {State} from "./types"

import './ListAlbums.css'

const ListAlbumsList = () => {
    const albums = useSelector(createSelector<State, AlbumsResult, Album[]>(
        (state) => state.albums,
        (albumsResult) => albumsResult.albums));

    const albumThumbnail = (album: Album) => {
        return <li key={album.id}>
            <figure>
                <img src={album.coverPhotoBaseUrl} alt={album.title} />
                <figcaption>{album.title}</figcaption>
            </figure>
        </li>;
    };

    const listItems = albums.map((album) => { return albumThumbnail(album) });

    return <ul>{listItems}</ul>
};

const ListAlbumsStatus = () => {
    const {state, albums, numLoadedPages, nextPageToken} = useSelector<State, AlbumsResult>((state) => state.albums);

    const dispatch = useDispatch();

    // auto load pages then use a button to load more
    const AUTO_LOAD_COUNT = 3;
    const listNext = () => { dispatch(albumsList(nextPageToken)) };
    const autoLoadNext = () => state === AlbumsState.MoreResults && numLoadedPages < AUTO_LOAD_COUNT;

    useEffect(() => {
        if (autoLoadNext()) {
            listNext();
        }
    });

    switch (state) {
        case AlbumsState.Loading:
            return <p className="status loading">Loading your albums&hellip;</p>;
        case AlbumsState.MoreResults:
            if (!autoLoadNext()) {
                return <button className="action" onClick={listNext}>Show more albums</button>;
            }
            break;
        case AlbumsState.Complete:
            if (albums.length === 0) {
                return <p className="status empty">You have no albums.</p>;
            }
            break;
        case AlbumsState.Error:
            return <p className="status error">There was a problem listing your albums.</p>;
    }

    return null;
};

const ListAlbums = () => {
    return <div className="ListAlbums"><h2>Albums</h2><ListAlbumsList/><ListAlbumsStatus/></div>
};

export default ListAlbums;
