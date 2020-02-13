import {Action} from "redux";
import {AlbumsResult} from "./albums";
import {MediaItemsResult} from "./mediaItems";

export interface Auth {
    token: string;
}

export interface State {
    auth?: Auth;
    albums: AlbumsResult;
    mediaItems: MediaItemsResult;
}

export interface ErrorAction extends Action {
    type: string;
    error: {};
}
