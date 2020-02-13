import { ofType, StateObservable } from 'redux-observable';
import { Observable, of, throwError } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map, mergeMap, switchMap, catchError, withLatestFrom } from 'rxjs/operators'
import { Action } from 'redux'

import { State, ErrorAction } from './types'
import {authRefresh} from "./auth";

export const MEDIA_ITEMS_LIST = 'MEDIA_ITEMS_LIST';
export const MEDIA_ITEMS_SUCCESS = 'MEDIA_ITEMS_SUCCESS';
export const MEDIA_ITEMS_FAILED = 'MEDIA_ITEMS_FAILED';

export interface MediaItemsListAction extends Action {
    type: typeof MEDIA_ITEMS_LIST
    pageToken?: string
}

export interface MediaItemsSuccessAction extends Action {
    type: typeof MEDIA_ITEMS_SUCCESS
    result: MediaItemsResult
}

export interface MediaItemsFailedAction extends ErrorAction {
    type: typeof MEDIA_ITEMS_FAILED
}

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
    nextPageToken?: string
}

export const mediaItemsList = (pageToken?: string): MediaItemsListAction => ({ type: MEDIA_ITEMS_LIST, pageToken });
export const mediaItemsSuccess = (result: MediaItemsResult): MediaItemsSuccessAction => ({ type: MEDIA_ITEMS_SUCCESS, result });
export const mediaItemsFailed = (error: {}): MediaItemsFailedAction => ({ type: MEDIA_ITEMS_FAILED, error });

export type MediaItemsActionTypes = MediaItemsListAction | MediaItemsSuccessAction | MediaItemsFailedAction

const initialState: MediaItemsResult = { state: MediaItemsState.Initial, mediaItems: [] };

export const mediaItemsReducer = (state = initialState, action: MediaItemsActionTypes) => {
    switch (action.type) {
        case MEDIA_ITEMS_LIST:
            return { ...state, state: MediaItemsState.Loading };
        case MEDIA_ITEMS_SUCCESS:
            const nextPageToken = action.result.nextPageToken;
            return { state: nextPageToken ? MediaItemsState.MoreResults : MediaItemsState.Complete, mediaItems:  state.mediaItems.concat(action.result.mediaItems), nextPageToken: nextPageToken };
        case MEDIA_ITEMS_FAILED:
            return { ...state, state: MediaItemsState.Error };
        default:
            return state;
    }
};

export const listMediaItemsEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType<Action, MediaItemsListAction>(MEDIA_ITEMS_LIST),
        withLatestFrom(state$),
        mergeMap(([action, state]) => state.auth ? of({ pageToken: action.pageToken, auth: state.auth }) : throwError('No auth')),
        switchMap(({ pageToken, auth }) => {
            let url = 'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100';
            if (pageToken) {
                url += '&pageToken=' + encodeURIComponent(pageToken);
            }

            return ajax({ url, headers: { Authorization: "Bearer " + auth.token }}).pipe(
                map(response => response.response),
                map(data => ({ mediaItems: [], ...data })),
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
