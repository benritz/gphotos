import React, {useEffect} from "react"
import {useDispatch, useSelector} from 'react-redux'
import {createSelector} from "reselect"

import {Album, albumsList, AlbumsResult, AlbumsState} from "./albums"
import {mediaItemsOpen} from "./mediaItems"
import {State} from "./types"
import {scrolledToBottom} from "./helpers"

import './ListAlbums.css'

const ListAlbumsList = () => {
    const albums = useSelector(createSelector<State, AlbumsResult, Album[]>(
        (state) => state.albums,
        (albumsResult) => albumsResult.albums));

    const dispatch = useDispatch();

    const openAlbum = (album: Album) => { dispatch(mediaItemsOpen(album.id)); };

    const albumThumbnail = (album: Album) => {
        return <li key={album.id}>
            <figure onClick={() => { openAlbum(album) }}>
                <img src={album.coverPhotoBaseUrl} alt={album.title} />
                <figcaption>{album.title}</figcaption>
            </figure>
        </li>;
    };

    const listItems = albums.map((album) => { return albumThumbnail(album) });

    return listItems.length ? <ul>{listItems}</ul> : null;
};

const ListAlbumsStatus = () => {
    const {
        state,
        albums,
        nextPageToken
    } = useSelector<State, AlbumsResult>((state) => state.albums);

    const dispatch = useDispatch();

    useEffect(() => {
        if (state === AlbumsState.MoreResults) {
            return scrolledToBottom('aside', () => {
                dispatch(albumsList(nextPageToken));
            });
        }
    });

    switch (state) {
        case AlbumsState.Loading:
            return <p className="status loading">Loading your albums&hellip;</p>;
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
