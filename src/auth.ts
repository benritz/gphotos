import { Action } from 'redux'

export const AUTH_SIGN_ON = 'AUTH_SIGN_ON';

export interface AuthSignOnAction extends Action {
    type: typeof AUTH_SIGN_ON,
    token: string
}

export type AuthActionTypes = AuthSignOnAction

export const authSignOn = (token: string): AuthSignOnAction => ({ type: AUTH_SIGN_ON, token });

export const authReducer = (state = null, action: AuthActionTypes) => {
    switch (action.type) {
        case AUTH_SIGN_ON:
            return { token: action.token};
        default:
            return state;
    }
};
