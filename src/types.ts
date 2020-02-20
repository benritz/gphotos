import {Action} from "redux";
import {AlbumsResult} from "./albums";
import {MediaItems} from "./mediaItems";

export interface Auth {
    token?: string;
}

export interface State {
    auth: Auth;
    albums: AlbumsResult;
    mediaItems: MediaItems;
}

export interface ErrorAction extends Action {
    type: string;
    error: {};
}
