import React, {useEffect} from "react"
import {useDispatch, useSelector} from 'react-redux'
import {createSelector} from "reselect"

import {MediaItem, mediaItemsList, MediaItemsResult, MediaItemsState} from "./mediaItems"
import {AlbumsResult} from "./albums"
import {State} from "./types"
import {scrolledToBottom} from "./helpers"

import './ListMediaItems.css'

interface CurrentResult {
    key: string
    result: MediaItemsResult
}

const currentResultSelector = createSelector<State, Map<string, MediaItemsResult>, string|undefined, CurrentResult|undefined>(
        (state) => state.mediaItems.results,
        (state) => state.mediaItems.currentKey,
        (results, key) => {
            if (key) {
                const result = results.get(key);
                if (result) {
                    return { key, result: result };
                }
            }

            return void 0;
        }
    );

const ListMediaItemsTitle = () => {
    const title = useSelector(createSelector<State, CurrentResult|undefined, AlbumsResult, string>(
        currentResultSelector,
        (state) => state.albums,
        (currentResult, albumsResult) => {
            if (currentResult) {
                const { result: { albumId } } = currentResult;

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

    console.log('NEW TITLE', title);

    return <h1>{title}</h1>;
};

const ListMediaItemsList = () => {
    const currentResult = useSelector(currentResultSelector);

    if (currentResult) {
        const { result } = currentResult;

        const listItems = result.mediaItems.map((mediaItem: MediaItem) => (<li key={mediaItem.id}><a href={mediaItem.productUrl}><img src={mediaItem.baseUrl} alt={mediaItem.filename} /></a></li>));
        if (listItems.length) {
            return <ul>{listItems}<li>&nbsp;</li></ul>;
        }
    }

    return null;
};

const ListMediaItemsStatus = () => {
    const currentResult = useSelector(currentResultSelector);

    const dispatch = useDispatch();

    useEffect(() => {
        if (currentResult) {
            const { key, result: { state, nextPageToken } } = currentResult;

            if (state === MediaItemsState.MoreResults) {
                return scrolledToBottom('main', () => {
                    dispatch(mediaItemsList(key, nextPageToken));
                });
            }
        }
    });

    if (currentResult) {
        const { result: { state, mediaItems } } = currentResult;

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
