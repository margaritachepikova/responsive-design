import { AppStore } from './AppStore.js';

const PAGE_REDIRECT = 'PAGE_REDIRECT';
const SLIDER_SETTINGS = 'SLIDER_SETTINGS';

let state = AppStore.getState();

const setState = (newSettings) => {
    state = AppStore.getState();
    AppStore.setState({ ...state, ...newSettings });
};

export const ActionsList = {
    [PAGE_REDIRECT]: ({ eventName, ...pageName }) => {
        setState(pageName);
    },
    [SLIDER_SETTINGS]: ({ eventName, ...newSettings }) => {
        setState({ sliderSettings: { ...(state.sliderSettings), ...newSettings }});
    }
};
