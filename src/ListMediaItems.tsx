import React from "react"
import {useDispatch, useSelector} from 'react-redux'

import './ListMediaItems.css';
import {MediaItem, MediaItemsResult, mediaItemsList} from "./mediaItems";
import {State} from "./types";

const ListMediaItems = () => {
    const mediaItemsResult = useSelector<State, MediaItemsResult>(state => state.mediaItems);
    const dispatch = useDispatch();

    if (mediaItemsResult.mediaItems.length) {
        const items = mediaItemsResult
            .mediaItems
            .map((mediaItem: MediaItem) => (<li key={mediaItem.id}><img src={mediaItem.baseUrl} /></li>));

        let button;

        if (mediaItemsResult.nextPageToken) {
            button = <button onClick={() => { dispatch(mediaItemsList(mediaItemsResult.nextPageToken)) }}>More&hellip;</button>;
        }

        return (
            <div>
                <ul className="ListMediaItems">{items}</ul>
                {button}
            </div>
        );
    } else {
        return <p>You have no photos or videos.</p>;
    }
};

export default ListMediaItems;
