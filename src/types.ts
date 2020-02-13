import {Action} from "redux";
import {Albums} from "./albums";
import {MediaItemsResult} from "./mediaItems";

export interface Auth {
    token: string;
}

export interface State {
    auth?: Auth;
    albums: Albums;
    mediaItems: MediaItemsResult;
}

export interface ErrorAction extends Action {
    type: string;
    error: {};
}
