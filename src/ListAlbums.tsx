import React from "react"
import {useDispatch, useSelector} from 'react-redux'
import {Album, Albums, albumsList} from "./albums";
import {State} from "./types";

const ListAlbums = () => {
    const albums = useSelector<State, Albums>(state => state.albums);
    const dispatch = useDispatch();

    const items = albums
        .albums
        .map((album: Album) => (<li key={album.id}>{album.title}</li>));

    const list = <ul className="ListAlbums">{items}</ul>;

    const button = albums.nextPageToken ? <button onClick={() => { dispatch(albumsList(albums.nextPageToken)) }}>More&hellip;</button> : null;

    return (
        <div>
            {list}
            {button}
        </div>
    );
};

export default ListAlbums;