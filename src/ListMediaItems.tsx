import React from "react"
import {useDispatch, useSelector} from 'react-redux'

import './ListMediaItems.css';
import {MediaItem, mediaItemsList, MediaItemsResult, MediaItemsState} from "./mediaItems";
import {State} from "./types";

const ListMediaItems = () => {
    const mediaItemsResult = useSelector<State, MediaItemsResult>(state => state.mediaItems);
    const dispatch = useDispatch();

    let stateMessage;

    switch (mediaItemsResult.state) {
        case MediaItemsState.Initial:
            break;
        case MediaItemsState.Loading:
            stateMessage = <p className="status loading">Loading your photos and videos&hellip;</p>;
            break;
        case MediaItemsState.MoreResults:
            stateMessage = <button className="action" onClick={() => { dispatch(mediaItemsList(mediaItemsResult.nextPageToken)) }}>Show more photos and videos&hellip;</button>;
            break;
        case MediaItemsState.Complete:
            if (mediaItemsResult.mediaItems.length === 0) {
                stateMessage = <p className="status empty">You have no photos or videos.</p>;
            }
            break;
        case MediaItemsState.Error:
            stateMessage = <p className="status error">There was a problem listing your photos and videos.</p>;
            break;
    }

    const listItems = mediaItemsResult
        .mediaItems
        .map((mediaItem: MediaItem) => (<li key={mediaItem.id}><img src={mediaItem.baseUrl} /></li>));

    return <div><ul className="ListMediaItems">{listItems}<li>&nbsp;</li></ul>{stateMessage}</div>

};

export default ListMediaItems;
