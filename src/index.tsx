import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {createStore, applyMiddleware, combineReducers, AnyAction} from 'redux';
import { createEpicMiddleware, combineEpics } from 'redux-observable';
import queryString from 'query-string';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { State } from './types'
import { authSignOn, authReducer } from './auth';
import { albumsList, albumsReducer, listAlbumsEpic } from './albums';
import { mediaItemsList, mediaItemsReducer, listMediaItemsEpic } from './mediaItems';

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, State, any>();

const store = createStore(
    combineReducers({ auth: authReducer, albums: albumsReducer, mediaItems: mediaItemsReducer }),
    applyMiddleware(epicMiddleware)
);

epicMiddleware.run(combineEpics(listAlbumsEpic, listMediaItemsEpic));

const render = () => {
    ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));
};

render();
store.subscribe(render);


const authenticate = () => {
    const loc = window.location;

    if (loc.hash)  {
        const { access_token } = queryString.parse(loc.hash.substring(1));

        if (access_token) {
            store.dispatch(authSignOn(access_token as string));
            store.dispatch(albumsList());
            store.dispatch(mediaItemsList());
            return;
        }
    }

    const params = {
        client_id: '1027230636453-aip8qkthi84iap126q3hvjma837cmd2f.apps.googleusercontent.com',
        redirect_uri: 'http://localhost:3000',
        response_type: 'token',
        scope:  'https://www.googleapis.com/auth/photoslibrary.readonly',
        state: '123456'
    };

    loc.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + queryString.stringify(params);
};


authenticate();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
