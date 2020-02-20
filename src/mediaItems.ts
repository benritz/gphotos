import { ofType, StateObservable } from 'redux-observable';
import {EMPTY, Observable, of, throwError} from 'rxjs'
import { ajax, AjaxRequest } from 'rxjs/ajax'
import {map, mergeMap, catchError, withLatestFrom, filter} from 'rxjs/operators'
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

export interface MediaItems {
    results: Map<string, MediaItemsResult>,
    currentKey?: string
}

export const MEDIA_ITEMS_OPEN = 'MEDIA_ITEMS_OPEN';
export const MEDIA_ITEMS_LIST = 'MEDIA_ITEMS_LIST';
export const MEDIA_ITEMS_LIST_SUCCESS = 'MEDIA_ITEMS_LIST_SUCCESS';
export const MEDIA_ITEMS_LIST_FAILED = 'MEDIA_ITEMS_LIST_FAILED';

export interface MediaItemsOpenAction extends Action {
    type: typeof MEDIA_ITEMS_OPEN
    albumId?: string
}

export interface MediaItemsListAction extends Action {
    type: typeof MEDIA_ITEMS_LIST
    key: string
    pageToken?: string
}

export interface MediaItemsListSuccessAction extends Action {
    type: typeof MEDIA_ITEMS_LIST_SUCCESS
    key: string
    pageToken?: string
    mediaItems: MediaItem[]
    nextPageToken?: string
}

export interface MediaItemsListFailedAction extends ErrorAction {
    type: typeof MEDIA_ITEMS_LIST_FAILED
    key: string
}

export const mediaItemsOpen = (albumId?: string): MediaItemsOpenAction => ({ type: MEDIA_ITEMS_OPEN, albumId });
export const mediaItemsList = (key: string, pageToken?: string): MediaItemsListAction => ({ type: MEDIA_ITEMS_LIST, key, pageToken });
export const mediaItemsListSuccess = (key: string, pageToken: string|undefined, mediaItems: MediaItem[], nextPageToken: string|undefined): MediaItemsListSuccessAction => ({ type: MEDIA_ITEMS_LIST_SUCCESS, key, pageToken, mediaItems, nextPageToken });
export const mediaItemsListFailed = (key: string, error: {}): MediaItemsListFailedAction => ({ type: MEDIA_ITEMS_LIST_FAILED, key, error });

export type MediaItemsActionTypes = MediaItemsOpenAction | MediaItemsListAction | MediaItemsListSuccessAction | MediaItemsListFailedAction

const initialState: MediaItems = { results: new Map<string, MediaItemsResult>() };

const initialResult = ({ albumId }: MediaItemsOpenAction): MediaItemsResult =>
    ({ state: MediaItemsState.Initial, mediaItems: [], numLoadedPages: 0, albumId });

const getKey = ({ albumId }: MediaItemsOpenAction): string => albumId || 'RECENT';

export const mediaItemsReducer = produce((draft: MediaItems, action: MediaItemsActionTypes) => {
        const { results } = draft;

        switch (action.type) {
            case MEDIA_ITEMS_OPEN: {
                const key = getKey(action);

                // setup any new results
                if (!results.has(key)) {
                    results.set(key, initialResult(action));
                }

                draft.currentKey = key;
                break;
            }
            case MEDIA_ITEMS_LIST: {
                const { key } = action,
                    result = results.get(key);

                if (result) {
                    result.state = MediaItemsState.Loading;
                }
                break;
            }
            case MEDIA_ITEMS_LIST_SUCCESS: {
                const { key, pageToken, mediaItems, nextPageToken } = action,
                    result = results.get(key);

                if (result && pageToken === result.nextPageToken) {
                    result.mediaItems.push(...(mediaItems || []));
                    result.state = nextPageToken ? MediaItemsState.MoreResults : MediaItemsState.Complete;
                    result.nextPageToken = nextPageToken;
                    result.numLoadedPages++;
                }
                break;
            }
            case MEDIA_ITEMS_LIST_FAILED: {
                const { key } = action,
                    result = results.get(key);

                if (result) {
                    result.state = MediaItemsState.Error;
                }
                break;
            }
        }
    },
    initialState
);

export const mediaItemsOpenEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType<Action, MediaItemsOpenAction>(MEDIA_ITEMS_OPEN),
        withLatestFrom(state$),
        map(([action, { mediaItems: { results } }]) => ({ key: getKey(action), results })),
        map(({ key, results }) => ({ key, result: results.get(key) })),
        filter(({ key, result }) => result?.state === MediaItemsState.Initial),
        map(({ key, result }) => mediaItemsList(key))
    );

export const mediaItemsListEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType<Action, MediaItemsListAction>(MEDIA_ITEMS_LIST),
        withLatestFrom(state$),
        mergeMap(([{ key, pageToken }, { auth, mediaItems: { results } }]) => auth.token ? of({ key, pageToken, results, auth }) : throwError('No auth token')),
        mergeMap(({ key, pageToken, results, auth }) => {
            const result = results.get(key);

            if (!result) {
                return EMPTY;
            }

            const req: AjaxRequest = {
                url: 'https://photoslibrary.googleapis.com/v1/mediaItems',
                headers: { Authorization: "Bearer " + auth.token }
            };

            const fields: any = { pageSize: 100 };

            if (pageToken) {
                fields['pageToken'] = pageToken;
            }

            if (result.albumId) {
                req.url += ':search';
                req.method = 'POST';

                if (result.albumId) {
                    fields['albumId'] = result.albumId;
                }
            }

            if (req.method === 'POST') {
                req.body = fields;
            } else {
                req.url += '?' + queryString.stringify(fields);
            }

            return ajax(req).pipe(
                map(response => response.response),
                map(({mediaItems, nextPageToken}) => mediaItemsListSuccess(key, pageToken, mediaItems, nextPageToken)),
                catchError(err => {
                    const actions: Action[] = [mediaItemsListFailed(key, err)];
                    if (err.status === 401) {
                        actions.push(authRefresh());
                    }

                    return of(...actions);
                })
            )
        })
    );
