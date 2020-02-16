
export const scrolledToBottom = (selector: string, callback: () => void): (() => void)|void => {
    const el = document.querySelector(selector);

    if (el) {
        const scrollHandler = () => {
            if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
                callback();
            }
        };

        el.addEventListener('scroll', scrollHandler);

        return () => { el.removeEventListener('scroll', scrollHandler); }
    }
};
