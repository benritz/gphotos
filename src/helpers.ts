import {fromEvent} from 'rxjs'
import {first, map} from "rxjs/operators"

export const scrolledToBottom = (selector: string, callback: () => void): (() => void)|void => {
    const el = document.querySelector(selector);
    if (el) {
        const sub = fromEvent(el, 'scroll').pipe(
            first(() => el.scrollTop + el.clientHeight >= el.scrollHeight),
            map(() => void 0)
        ).subscribe(callback);

        return () => sub.unsubscribe()
    }
};
