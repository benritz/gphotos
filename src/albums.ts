import { ofType, StateObservable } from 'redux-observable';
import { Observable, of, throwError } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map, mergeMap, switchMap, catchError, withLatestFrom } from 'rxjs/operators'
import { Action, AnyAction } from 'redux'

import { State, Auth } from './types'

const LIST_ALBUMS = 'LIST_ALBUMS';
const ALBUMS_SUCCESS = 'ALBUMS_SUCCESS';
const ALBUMS_FAILED = 'ALBUMS_FAILED';

// interface AlbumSuccessAction extends Action {
//     type: string;
//     albums: [];
// }
//
// interface ErrorAction extends Action {
//     type: string;
//     error: {};
// }

export const listAlbums = (): AnyAction => ({ type: LIST_ALBUMS });
export const albumsSuccess = (albums: []): AnyAction => ({ type: ALBUMS_SUCCESS, albums });
export const albumsFailed = (error: {}): AnyAction => ({ type: ALBUMS_FAILED, error });

export const albums = (state = [], action: AnyAction) => {
    switch (action.type) {
        case ALBUMS_SUCCESS:
            return action.albums;
        case ALBUMS_FAILED:
            return "Failed to get albums: " + action.error.message;

        default:
            return state;
    }
};

export const listAlbumsEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType(LIST_ALBUMS),
        withLatestFrom(state$),
        mergeMap(([, state]) => state.auth ? of(state.auth) : throwError('No auth')),
        switchMap((auth: Auth) => ajax({
            url: 'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100',
            headers: { Authorization: "Bearer " + auth.token }
        })),
        map(response => response.response),
        map(data => albumsSuccess(data.mediaItems)),
        catchError(err => {
                console.log(err);
                return of(albumsFailed(err))
            }
        )
    );


