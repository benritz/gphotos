import {Action} from "redux";

export interface Auth {
    token: string;
}

export interface State {
    auth?: Auth;
}

export interface ErrorAction extends Action {
    type: string;
    error: {};
}
