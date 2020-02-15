import React, {useEffect} from "react"
import {useDispatch, useSelector} from 'react-redux'
import {createSelector} from "reselect";

import {MediaItem, mediaItemsList, MediaItemsResult, MediaItemsState} from "./mediaItems";
import {State} from "./types";

import './ListMediaItems.css';

const ListMediaItemsList = () => {
    const mediaItems = useSelector(createSelector<State, MediaItemsResult, MediaItem[]>(
        (state) => state.mediaItems,
        (mediaItemsResult) => mediaItemsResult.mediaItems));

    const listItems = mediaItems.map((mediaItem: MediaItem) => (<li key={mediaItem.id}><img src={mediaItem.baseUrl} /></li>));

    return <ul>{listItems}<li>&nbsp;</li></ul>
};


const ListMediaItemsStatus = () => {
    const {state, mediaItems, albumId, numLoadedPages, nextPageToken} = useSelector<State, MediaItemsResult>((state) => state.mediaItems);

    const dispatch = useDispatch();

    // auto load pages then use a button to load more
    const AUTO_LOAD_COUNT = 3;
    const listNext = () => { dispatch(mediaItemsList(albumId, nextPageToken)) };
    const autoLoadNext = () => state === MediaItemsState.MoreResults && numLoadedPages < AUTO_LOAD_COUNT;

    useEffect(() => {
        if (autoLoadNext()) {
            listNext();
        }
    });

    switch (state) {
        case MediaItemsState.Loading:
            return <p className="status loading">Loading your photos and videos&hellip;</p>;
        case MediaItemsState.MoreResults:
            if (!autoLoadNext()) {
                return <button className="action" onClick={listNext}>Show more photos and videos</button>;
            }
            break;
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

const ListMediaItems = () => {
    return <div className="ListMediaItems"><h2>Photos</h2><ListMediaItemsList/><ListMediaItemsStatus/></div>
};

export default ListMediaItems;
