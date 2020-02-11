import { ofType, StateObservable } from 'redux-observable';
import { Observable, of, combineLatest, throwError } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map, mergeMap, switchMap, catchError } from 'rxjs/operators'

const LIST_ALBUMS = 'LIST_ALBUMS';
const ALBUMS_SUCCESS = 'ALBUMS_SUCCESS';
const ALBUMS_FAILED = 'ALBUMS_FAILED';

interface Auth {
    token: string;
}

interface State {
    auth?: Auth;
}

interface Action {
    type: string;
}

interface AlbumSuccessAction extends Action {
    type: string;
    albums: [];
}

interface ErrorAction extends Action {
    type: string;
    error: {};
}

export const listAlbums = (): Action => ({ type: LIST_ALBUMS });
export const albumsSuccess = (albums: []): AlbumSuccessAction => ({ type: ALBUMS_SUCCESS, albums });
export const albumsFailed = (error: {}): ErrorAction => ({ type: ALBUMS_FAILED, error });

export const listAlbumsEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    combineLatest([
        action$.pipe(ofType(LIST_ALBUMS)),
        state$.pipe(mergeMap(({auth}) => auth))
    ]).pipe(
        switchMap(([action, auth]) => ajax({
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

//(mergeMap(({auth}) => auth ? of(auth) : throwError('No auth'))
