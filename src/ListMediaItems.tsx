import React, {useEffect} from "react"
import {useDispatch, useSelector} from 'react-redux'
import {createSelector} from "reselect"

import {MediaItem, mediaItemsList, MediaItemsState} from "./mediaItems"
import {State} from "./types"
import {scrolledToBottom} from "./helpers"

import './ListMediaItems.css'

const resultsSelector = (state: State) => state.mediaItems.results;
const currentKeySelector = (state: State) => state.mediaItems.currentKey;

const currentResultSelector = createSelector(
    [resultsSelector, currentKeySelector],
    (results, key) => {
        if (key) {
            return results.get(key);
        }

        return void 0;
    }
);

const ListMediaItemsTitle = () => {
    const title = useSelector(createSelector(
        [currentResultSelector, (state: State) => state.albums],
        (result, albumsResult) => {
            if (result) {
                const { albumId } = result;

                if (!albumId) {
                    return 'Your photos';
                }

                const album = albumsResult.albums.find(album => album.id === albumId);
                if (album) {
                    return album.title;
                }
            }

            return '';
        }));

    return <h1>{title}</h1>;
};

const ListMediaItemsList = () => {
    const result = useSelector(currentResultSelector);

    if (result) {
        const listItems = result.mediaItems.map((mediaItem: MediaItem) => (<li key={mediaItem.id}><a href={mediaItem.productUrl}><img src={mediaItem.baseUrl} alt={mediaItem.filename} /></a></li>));
        if (listItems.length) {
            return <ul>{listItems}<li>&nbsp;</li></ul>;
        }
    }

    return null;
};

const ListMediaItemsStatus = () => {
    const key = useSelector(currentKeySelector);
    const result = useSelector(currentResultSelector);

    const dispatch = useDispatch();

    useEffect(() => {
        if (key && result) {
            const { state, nextPageToken } = result;

            if (state === MediaItemsState.MoreResults) {
                return scrolledToBottom('main', () => {
                    dispatch(mediaItemsList(key, nextPageToken));
                });
            }
        }
    });

    if (result) {
        const { state, mediaItems } = result;

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
