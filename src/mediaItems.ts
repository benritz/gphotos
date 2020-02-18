import { ofType, StateObservable } from 'redux-observable';
import { Observable, of, throwError } from 'rxjs'
import { ajax, AjaxRequest } from 'rxjs/ajax'
import {map, mergeMap, switchMap, catchError, withLatestFrom} from 'rxjs/operators'
import { Action } from 'redux'
import { produce } from 'immer';
import queryString from 'querystring';

import { State, ErrorAction } from './types'
import {authRefresh} from "./auth";

export enum MediaItemsState {
    Initial, Loading, MoreResults, Complete,  Error
}

export interface MediaItem {
    id: string
    baseUrl: string
    productUrl: string
    filename: string;
}

export interface MediaItemsResult {
    state: MediaItemsState
    mediaItems: MediaItem[]
    albumId?: string
    numLoadedPages: number
    nextPageToken?: string
}

export const MEDIA_ITEMS_LIST = 'MEDIA_ITEMS_LIST';
export const MEDIA_ITEMS_LIST_SUCCESS = 'MEDIA_ITEMS_LIST_SUCCESS';
export const MEDIA_ITEMS_LIST_FAILED = 'MEDIA_ITEMS_LIST_FAILED';

export interface MediaItemsListAction extends Action {
    type: typeof MEDIA_ITEMS_LIST
    albumId?: string
    pageToken?: string
}

export interface MediaItemsListSuccessAction extends Action {
    type: typeof MEDIA_ITEMS_LIST_SUCCESS
    mediaItems: MediaItem[]
    nextPageToken?: string
}

export interface MediaItemsListFailedAction extends ErrorAction {
    type: typeof MEDIA_ITEMS_LIST_FAILED
}

export const mediaItemsList = (albumId?: string, pageToken?: string): MediaItemsListAction => ({ type: MEDIA_ITEMS_LIST, albumId, pageToken });
export const mediaItemsListSuccess = (mediaItems: MediaItem[], nextPageToken?: string): MediaItemsListSuccessAction => ({ type: MEDIA_ITEMS_LIST_SUCCESS, mediaItems, nextPageToken });
export const mediaItemsListFailed = (error: {}): MediaItemsListFailedAction => ({ type: MEDIA_ITEMS_LIST_FAILED, error });

export type MediaItemsActionTypes = MediaItemsListAction | MediaItemsListSuccessAction | MediaItemsListFailedAction

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
            case MEDIA_ITEMS_LIST_SUCCESS:
                const { nextPageToken, mediaItems } = action;

                draft.mediaItems.push(...(mediaItems || []));
                draft.state = nextPageToken ? MediaItemsState.MoreResults : MediaItemsState.Complete;
                draft.nextPageToken = nextPageToken;
                draft.numLoadedPages++;
                break;
            case MEDIA_ITEMS_LIST_FAILED:
                draft.state = MediaItemsState.Error;
                break;
        }
    },
    initialState
);

export const mediaItemsListEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType<Action, MediaItemsListAction>(MEDIA_ITEMS_LIST),
        withLatestFrom(state$),
        mergeMap(([{ albumId, pageToken }, { auth }]) => auth.token ? of({ albumId, pageToken, auth }) : throwError('No auth token')),
        switchMap(({ albumId, pageToken, auth }) => {
            const req: AjaxRequest = {
                url: 'https://photoslibrary.googleapis.com/v1/mediaItems',
                headers: { Authorization: "Bearer " + auth.token }
            };

            const fields: any = { pageSize: 100 };

            if (pageToken) {
                fields['pageToken'] = pageToken;
            }

            if (albumId) {
                req.url += ':search';
                req.method = 'POST';

                if (albumId) {
                    fields['albumId'] = albumId;
                }
            }

            if (req.method === 'POST') {
                req.body = fields;
            } else {
                req.url += '?' + queryString.stringify(fields);
            }

            return ajax(req).pipe(
                map(response => response.response),
                map(({mediaItems, nextPageToken}) => mediaItemsListSuccess(mediaItems, nextPageToken)),
                catchError(err => {
                    const actions: Action[] = [mediaItemsListFailed(err)];
                    if (err.status === 401) {
                        actions.push(authRefresh());
                    }

                    return of(...actions);
                })
            )
        })
    );
