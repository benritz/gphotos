import React, {useEffect} from "react"
import {useDispatch, useSelector} from 'react-redux'
import {createSelector} from "reselect"

import {MediaItem, mediaItemsList, MediaItemsResult, MediaItemsState} from "./mediaItems"
import {AlbumsResult} from "./albums"
import {State} from "./types"
import {scrolledToBottom} from "./helpers"

import './ListMediaItems.css'

const ListMediaItemsTitle = () => {
    const title = useSelector(createSelector<State, MediaItemsResult, AlbumsResult, string>(
        (state) => state.mediaItems,
        (state) => state.albums,
        (mediaItemsResult, albumsResult) => {
            const { albumId } = mediaItemsResult;
            if (albumId) {
                const album = albumsResult.albums.find(album => album.id === albumId);
                if (album) {
                    return album.title;
                }
            }
            return 'Your photos';
        }));

    return <h1>{title}</h1>;
};

const ListMediaItemsList = () => {
    const mediaItems = useSelector(createSelector<State, MediaItemsResult, MediaItem[]>(
        (state) => state.mediaItems,
        (mediaItemsResult) => mediaItemsResult.mediaItems));

    const listItems = mediaItems.map((mediaItem: MediaItem) => (<li key={mediaItem.id}><a href={mediaItem.productUrl}><img src={mediaItem.baseUrl} alt={mediaItem.filename} /></a></li>));

    return listItems.length ? <ul>{listItems}<li>&nbsp;</li></ul> : null;
};

const ListMediaItemsStatus = () => {
    const {
        state,
        mediaItems,
        albumId,
        nextPageToken
    } = useSelector<State, MediaItemsResult>((state) => state.mediaItems);

    const dispatch = useDispatch();

    useEffect(() => {
        if (state === MediaItemsState.MoreResults) {
            return scrolledToBottom('main', () => {
                dispatch(mediaItemsList(albumId, nextPageToken));
            });
        }
    });

    switch (state) {
        case MediaItemsState.Loading:
            return <p className="status loading">Loading your photos and videos&hellip;</p>;
        case MediaItemsState.Complete:
            if (mediaItems.length === 0) {
                return <p className="status empty">You have no photos or videos.</p>;
            }
            break;
        case MediaItemsState.Error:
            return <p className="status error">There was a problem listing your photos and videos.</p>;
    }

    return null;
};

const ListMediaItems = () => (
    <div className="ListMediaItems">
        <ListMediaItemsTitle/>
        <ListMediaItemsList/>
        <ListMediaItemsStatus/>
    </div>
);

export default ListMediaItems;
