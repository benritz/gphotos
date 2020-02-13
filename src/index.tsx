import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {createStore, applyMiddleware, combineReducers, AnyAction} from 'redux';
import { createEpicMiddleware, combineEpics } from 'redux-observable';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { State } from './types'
import {authSignOn, authReducer, authRedirect, authGetToken, authRefreshEpic} from './auth';
import { albumsList, albumsReducer, listAlbumsEpic } from './albums';
import { mediaItemsList, mediaItemsReducer, listMediaItemsEpic } from './mediaItems';

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, State, any>();

const store = createStore(
    combineReducers({ auth: authReducer, albums: albumsReducer, mediaItems: mediaItemsReducer }),
    applyMiddleware(epicMiddleware)
);

epicMiddleware.run(combineEpics(listAlbumsEpic, listMediaItemsEpic, authRefreshEpic));

const render = () => {
    ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));
};

render();
store.subscribe(render);

const authenticate = () => {
    const token = authGetToken();
    if (token)  {
        store.dispatch(authSignOn(token as string));
        store.dispatch(albumsList());
        store.dispatch(mediaItemsList());
        return;
    }

    authRedirect();
};

authenticate();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
