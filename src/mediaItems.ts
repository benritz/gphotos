import { ofType, StateObservable } from 'redux-observable';
import { Observable, of, throwError } from 'rxjs'
import { ajax, AjaxRequest } from 'rxjs/ajax'
import {map, mergeMap, switchMap, catchError, withLatestFrom} from 'rxjs/operators'
import { Action } from 'redux'
import { produce } from 'immer';

import { State, ErrorAction } from './types'
import {authRefresh} from "./auth";

export enum MediaItemsState {
    Initial, Loading, MoreResults, Complete,  Error
}

export interface MediaItem {
    id: string
    baseUrl: string
    productUrl: string
}

export interface MediaItemsResult {
    state: MediaItemsState
    mediaItems: MediaItem[]
    albumId?: string
    numLoadedPages: number
    nextPageToken?: string
}

export const MEDIA_ITEMS_LIST = 'MEDIA_ITEMS_LIST';
export const MEDIA_ITEMS_SUCCESS = 'MEDIA_ITEMS_SUCCESS';
export const MEDIA_ITEMS_FAILED = 'MEDIA_ITEMS_FAILED';

export interface MediaItemsListAction extends Action {
    type: typeof MEDIA_ITEMS_LIST
    albumId?: string
    pageToken?: string
}

export interface MediaItemsSuccessAction extends Action {
    type: typeof MEDIA_ITEMS_SUCCESS
    result: MediaItemsResult
}

export interface MediaItemsFailedAction extends ErrorAction {
    type: typeof MEDIA_ITEMS_FAILED
}

export const mediaItemsList = (albumId?: string, pageToken?: string): MediaItemsListAction => ({ type: MEDIA_ITEMS_LIST, albumId, pageToken });
export const mediaItemsSuccess = (result: MediaItemsResult): MediaItemsSuccessAction => ({ type: MEDIA_ITEMS_SUCCESS, result });
export const mediaItemsFailed = (error: {}): MediaItemsFailedAction => ({ type: MEDIA_ITEMS_FAILED, error });

export type MediaItemsActionTypes = MediaItemsListAction | MediaItemsSuccessAction | MediaItemsFailedAction

const initialState: MediaItemsResult = { state: MediaItemsState.Initial, mediaItems: [], numLoadedPages: 0 };

export const mediaItemsReducer = produce((draft: MediaItemsResult, action: MediaItemsActionTypes) => {
        switch (action.type) {
            case MEDIA_ITEMS_LIST:
                draft.state = MediaItemsState.Loading;

                if (!action.pageToken) {
                    draft.mediaItems = [];
                }

                draft.albumId = action.albumId;

                break;
            case MEDIA_ITEMS_SUCCESS:
                const nextPageToken = action.result.nextPageToken;

                draft.state = nextPageToken ? MediaItemsState.MoreResults : MediaItemsState.Complete;
                draft.mediaItems.push(...action.result.mediaItems);
                draft.nextPageToken = nextPageToken;
                draft.numLoadedPages++;
                break;
            case MEDIA_ITEMS_FAILED:
                draft.state = MediaItemsState.Error;
                break;
        }
    },
    initialState
);

export const listMediaItemsEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType<Action, MediaItemsListAction>(MEDIA_ITEMS_LIST),
        withLatestFrom(state$),
        mergeMap(([{ albumId, pageToken }, { auth }]) => auth.token ? of({ albumId, pageToken, auth }) : throwError('No auth token')),
        switchMap(({ albumId, pageToken, auth }) => {
            const req: AjaxRequest = {
                url: 'https://photoslibrary.googleapis.com/v1/mediaItems',
                headers: { Authorization: "Bearer " + auth.token }
            };

            if (albumId) {
                req.url += ':search';

                req.method = 'POST';

                const body: any = { albumId, pageSize: 100 };
                if (pageToken) {
                    body['pageToken'] = pageToken;
                }

                req.body = body;
            } else {
                req.url += '?pageSize=100';

                if (pageToken) {
                    req.url += '&pageToken=' + encodeURIComponent(pageToken);
                }
            }

            return ajax(req).pipe(
                map(response => response.response),
                map(data => mediaItemsSuccess(data)),
                catchError(err => {
                    const actions: Action[] = [mediaItemsFailed(err)];
                    if (err.status === 401) {
                        actions.push(authRefresh());
                    }

                    return of(...actions);
                })
            )
        })
    );
