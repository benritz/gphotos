import React from "react"
import {useDispatch, useSelector} from 'react-redux'
import {Album, Albums, albumsList} from "./albums";
import {State} from "./types";

const ListAlbums = () => {
    const albums = useSelector<State, Albums>(state => state.albums);
    const dispatch = useDispatch();

    if (albums.albums.length) {
        const items = albums
            .albums
            .map((album: Album) => (<li key={album.id}>{album.title}</li>));

        let button;

        if (albums.nextPageToken) {
            button = <button onClick={() => { dispatch(albumsList(albums.nextPageToken)) }}>More&hellip;</button>;
        }

        return (
            <div>
                <ul className="ListAlbums">{items}</ul>
                {button}
            </div>
        );
    } else {
        return <p>You have no albums.</p>;
    }
};

export default ListAlbums;
