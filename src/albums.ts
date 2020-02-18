import { ofType, StateObservable } from 'redux-observable';
import { Observable, of, throwError } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map, mergeMap, switchMap, catchError, withLatestFrom } from 'rxjs/operators'
import { Action } from 'redux'
import { produce } from 'immer'

import { State, ErrorAction } from './types'
import {authRefresh} from "./auth";

export interface Album {
    id: string;
    title: string;
    productUrl: string;
    mediaItemsCount: number;
    coverPhotoBaseUrl: string;
    coverPhotoMediaItemId: string;
}

export enum AlbumsState {
    Initial, Loading, MoreResults, Complete,  Error
}

export interface AlbumsResult {
    state: AlbumsState
    albums: Album[],
    numLoadedPages: number;
    nextPageToken?: string
}

export const ALBUMS_LIST = 'ALBUMS_LIST';
export const ALBUMS_SUCCESS = 'ALBUMS_SUCCESS';
export const ALBUMS_FAILED = 'ALBUMS_FAILED';

export interface AlbumsListAction extends Action {
    type: typeof ALBUMS_LIST;
    pageToken?: string;
}

export interface AlbumsSuccessAction extends Action {
    type: typeof ALBUMS_SUCCESS;
    albumsResp: AlbumsResult;
}

export interface AlbumsFailedAction extends ErrorAction {
    type: typeof ALBUMS_FAILED;
}

export const albumsList = (pageToken?: string): AlbumsListAction => ({ type: ALBUMS_LIST, pageToken });
export const albumsSuccess = (albumsResp: AlbumsResult): AlbumsSuccessAction => ({ type: ALBUMS_SUCCESS, albumsResp });
export const albumsFailed = (error: {}): AlbumsFailedAction => ({ type: ALBUMS_FAILED, error });

export type AlbumsActionTypes = AlbumsListAction | AlbumsSuccessAction | AlbumsFailedAction

const initialState: AlbumsResult = { state: AlbumsState.Initial, albums: [], numLoadedPages: 0 };

export const albumsReducer = produce((draft: AlbumsResult, action: AlbumsActionTypes) => {
        switch (action.type) {
            case ALBUMS_LIST:
                draft.state = AlbumsState.Loading;
                break;
            case ALBUMS_SUCCESS:
                const { albums, nextPageToken } = action.albumsResp;

                draft.albums.push(...(albums || []));
                draft.state = nextPageToken ? AlbumsState.MoreResults : AlbumsState.Complete;
                draft.nextPageToken = nextPageToken;
                draft.numLoadedPages++;
                break;
            case ALBUMS_FAILED:
                draft.state = AlbumsState.Error;
                break;
        }
    },
    initialState
);

export const albumsListEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType<Action, AlbumsListAction>(ALBUMS_LIST),
        withLatestFrom(state$),
        mergeMap(([{pageToken}, {auth}]) => auth.token ? of({ pageToken, auth }) : throwError('No auth token')),
        switchMap(({ pageToken, auth }) => {
            let url = 'https://photoslibrary.googleapis.com/v1/albums?pageSize=50';
            if (pageToken) {
                url += '&pageToken=' + encodeURIComponent(pageToken);
            }

            return ajax({ url, headers: { Authorization: "Bearer " + auth.token }}).pipe(
                map(response => response.response),
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
