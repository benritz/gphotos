import React from 'react'
import {useDispatch} from 'react-redux'
import {mediaItemsList} from './mediaItems'

import './SearchOptions.css'

const SearchOptions = () => {
    const dispatch = useDispatch();

    const listMostRecent = () => {
        dispatch(mediaItemsList());
    };

    return <ul className='SearchOptions'>
        <li key='mostRecent'><button onClick={() => listMostRecent()}>Most recent photos and videos</button></li>
    </ul>;
};

export default SearchOptions;