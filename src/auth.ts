import { Action } from 'redux'
import {EMPTY, Observable} from "rxjs";
import {ofType, StateObservable} from "redux-observable";
import {map, tap} from "rxjs/operators";
import queryString from "query-string";
import { produce } from 'immer';

import {Auth, State} from "./types";

export const AUTH_SIGN_ON = 'AUTH_SIGN_ON';
export const AUTH_REFRESH = 'AUTH_REFRESH';

export interface AuthSignOnAction extends Action {
    type: typeof AUTH_SIGN_ON,
    token: string
}

export interface AuthRefreshAction extends Action {
    type: typeof AUTH_REFRESH,
}

export type AuthActionTypes = AuthSignOnAction | AuthRefreshAction

export const authSignOn = (token: string): AuthSignOnAction => ({ type: AUTH_SIGN_ON, token });
export const authRefresh = (): AuthRefreshAction => ({ type: AUTH_REFRESH });

const initialState: Auth = {};

export const authReducer = produce((draft: Auth, action: AuthActionTypes) => {
        switch (action.type) {
            case AUTH_SIGN_ON:
                draft.token = action.token;
                break;
            case AUTH_REFRESH:
                draft.token = undefined;
                break;
        }
    },
    initialState
);

export const authRefreshEpic = (action$: Observable<Action>, state$: StateObservable<State>) =>
    action$.pipe(
        ofType<Action, AuthRefreshAction>(AUTH_REFRESH),
        tap(() => authRedirect()),
        map(() => EMPTY)
    );

export const authGetToken = () => {
    const hash = window.location.hash;
    if (hash)  {
        const { access_token } = queryString.parse(hash.substring(1));
        if (access_token) {
            return access_token;
        }
    }

    return null;
};

export const authRedirect = () => {
    const params = {
        client_id: '1027230636453-aip8qkthi84iap126q3hvjma837cmd2f.apps.googleusercontent.com',
        redirect_uri: 'http://localhost:3000',
        response_type: 'token',
        scope:  'https://www.googleapis.com/auth/photoslibrary.readonly',
        state: '123456'
    };

    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + queryString.stringify(params);
};
