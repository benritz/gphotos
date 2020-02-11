import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {createStore, applyMiddleware, combineReducers, AnyAction} from 'redux';
import { createEpicMiddleware, combineEpics } from 'redux-observable';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { State, Auth } from './types'
import { listAlbums, albums, listAlbumsEpic } from './albums';

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, State, any>();

const store = createStore(
    combineReducers({ albums }),
    applyMiddleware(epicMiddleware)
);

epicMiddleware.run(combineEpics(listAlbumsEpic));

store.dispatch(listAlbums());

const render = () => {
    ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));
};

render();
store.subscribe(render);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
