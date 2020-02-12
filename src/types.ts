import {Action} from "redux";
import {Albums} from "./albums";

export interface Auth {
    token: string;
}

export interface State {
    auth?: Auth;
    albums: Albums;
}

export interface ErrorAction extends Action {
    type: string;
    error: {};
}
