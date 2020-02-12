import { ofType, StateObservable } from 'redux-observable';
import { Observable, of, throwError } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map, mergeMap, switchMap, catchError, withLatestFrom, tap } from 'rxjs/operators'
import { Action } from 'redux'

import { State, Auth, ErrorAction } from './types'

export const ALBUMS_LIST = 'ALBUMS_LIST';
export const ALBUMS_SUCCESS = 'ALBUMS_SUCCESS';
export const ALBUMS_FAILED = 'ALBUMS_FAILED';

export interface AlbumsListAction extends Action {
    type: typeof ALBUMS_LIST;
}

export interface AlbumsSuccessAction extends Action {
    type: typeof ALBUMS_SUCCESS;
    albums: [];
}

export interface AlbumsFailedAction extends ErrorAction {
    type: typeof ALBUMS_FAILED;
}

export const albumsList = (): AlbumsListAction => ({ type: ALBUMS_LIST });
export const albumsSuccess = (albums: []): AlbumsSuccessAction => ({ type: ALBUMS_SUCCESS, albums });
export const albumsFailed = (error: {}): AlbumsFailedAction => ({ type: ALBUMS_FAILED, error });

export type AlbumsActionTypes = AlbumsListAction | AlbumsSuccessAction | AlbumsFailedAction

export const albumsReducer = (state = [], action: AlbumsActionTypes) => {
    switch (action.type) {
        case ALBUMS_SUCCESS:
            return action.albums;
        case ALBUMS_FAILED:
            return "Failed to get albumsReducer: " + action.error;
        default:
            return state;
    }
};

export const listAlbumsEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType(ALBUMS_LIST),
        withLatestFrom(state$),
        mergeMap(([, state]) => state.auth ? of(state.auth) : throwError('No auth')),
        switchMap((auth: Auth) => ajax({
            url: 'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100',
            headers: { Authorization: "Bearer " + auth.token }
        })),
        map(response => response.response),
        map(data => albumsSuccess(data.mediaItems)),
        tap((data) => {
            console.log(data);
        }),
        catchError(err => {
                return of(albumsFailed(err))
            }
        )
    );


