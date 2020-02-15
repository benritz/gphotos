import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, batch } from 'react-redux';
import {createStore, applyMiddleware, combineReducers, AnyAction} from 'redux';
import { createEpicMiddleware, combineEpics } from 'redux-observable';
import logger from 'redux-logger'

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { State } from './types'
import {authSignOn, authReducer, authRedirect, authGetToken, authRefreshEpic} from './auth';
import { albumsList, albumsReducer, listAlbumsEpic } from './albums';
import { mediaItemsList, mediaItemsReducer, listMediaItemsEpic } from './mediaItems';

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, State, any>();

// TODO check out https://github.com/tappleby/redux-batched-subscribe to prevent multiple actions causing multiple renders
// i.e. ALBUMS_LIST > ALBUMS_SUCCESS causing two renders

const store = createStore(
    combineReducers({ auth: authReducer, albums: albumsReducer, mediaItems: mediaItemsReducer }),
    applyMiddleware(logger, epicMiddleware)
);

epicMiddleware.run(combineEpics(listAlbumsEpic, listMediaItemsEpic, authRefreshEpic));

const authenticate = () => {
    const token = authGetToken();
    if (token)  {
        batch(() => {
            const dispatch = store.dispatch;
            dispatch(authSignOn(token as string));
            dispatch(albumsList());
            dispatch(mediaItemsList());
        });
        return;
    }

    authRedirect();
};

authenticate();

ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
