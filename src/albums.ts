import { ofType, StateObservable } from 'redux-observable';
import { Observable, of, throwError } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map, mergeMap, switchMap, catchError, withLatestFrom } from 'rxjs/operators'
import { Action } from 'redux'

import { State, ErrorAction } from './types'
import {authRefresh} from "./auth";

export const ALBUMS_LIST = 'ALBUMS_LIST';
export const ALBUMS_SUCCESS = 'ALBUMS_SUCCESS';
export const ALBUMS_FAILED = 'ALBUMS_FAILED';

export interface AlbumsListAction extends Action {
    type: typeof ALBUMS_LIST;
    pageToken?: string;
}

export interface AlbumsSuccessAction extends Action {
    type: typeof ALBUMS_SUCCESS;
    albumsResp: AlbumsResponse;
}

export interface AlbumsFailedAction extends ErrorAction {
    type: typeof ALBUMS_FAILED;
}

export enum AlbumsState {
    Initial, Loading, MoreResults, Complete,  Error
}

export interface Album {
    id: string;
    title: string;
}

export interface AlbumsResult {
    state: AlbumsState
    albums: Album[]
    nextPageToken?: string
}

export interface AlbumsResponse extends AlbumsResult {
    pageToken?: string;
}

export const albumsList = (pageToken?: string): AlbumsListAction => ({ type: ALBUMS_LIST, pageToken });
export const albumsSuccess = (albumsResp: AlbumsResponse): AlbumsSuccessAction => ({ type: ALBUMS_SUCCESS, albumsResp });
export const albumsFailed = (error: {}): AlbumsFailedAction => ({ type: ALBUMS_FAILED, error });

export type AlbumsActionTypes = AlbumsListAction | AlbumsSuccessAction | AlbumsFailedAction

const initialState: AlbumsResult = { state: AlbumsState.Initial, albums: [] };

export const albumsReducer = (state = initialState, action: AlbumsActionTypes) => {
    switch (action.type) {
        case ALBUMS_LIST:
            return { ...state, state: AlbumsState.Loading };
        case ALBUMS_SUCCESS:
            const nextPageToken = action.albumsResp.nextPageToken;
            return { state: nextPageToken ? AlbumsState.MoreResults : AlbumsState.Complete, albums: state.albums.concat(action.albumsResp.albums), nextPageToken: nextPageToken };
        case ALBUMS_FAILED:
            return { ...state, state: AlbumsState.Error };
        default:
            return state;
    }
};

export const listAlbumsEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType<Action, AlbumsListAction>(ALBUMS_LIST),
        withLatestFrom(state$),
        mergeMap(([action, state]) => state.auth ? of({ pageToken: action.pageToken, auth: state.auth }) : throwError('No auth')),
        switchMap(({ pageToken, auth }) => {
            let url = 'https://photoslibrary.googleapis.com/v1/albums?pageSize=50';
            if (pageToken) {
                url += '&pageToken=' + encodeURIComponent(pageToken);
            }

            return ajax({ url, headers: { Authorization: "Bearer " + auth.token }}).pipe(
                map(response => response.response),
                map(data => ({ albums: [], ...data, pageToken })),
                map(data => albumsSuccess(data)),
                catchError(err => {
                    const actions: Action[] = [albumsFailed(err)];

                    if (err.status === 401) {
                        actions.push(authRefresh());
                    }

                    return of(...actions);
                })
            )
        })
    );
