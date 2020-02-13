import React from "react"
import {useDispatch, useSelector} from 'react-redux'
import {Album, albumsList, AlbumsResult, AlbumsState} from "./albums";
import {State} from "./types";

const ListAlbums = () => {
    const albumsResult = useSelector<State, AlbumsResult>(state => state.albums);
    const dispatch = useDispatch();

    let stateMessage;

    switch (albumsResult.state) {
        case AlbumsState.Initial:
            break;
        case AlbumsState.Loading:
            stateMessage = <p>Loading your albums&hellip;</p>;
            break;
        case AlbumsState.MoreResults:
            console.log('MORE RESULTS');
            const listNext = () => { dispatch(albumsList(albumsResult.nextPageToken)) };
            stateMessage = <button onClick={listNext}>More&hellip;</button>;
            //setTimeout(listNext, 0);
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
