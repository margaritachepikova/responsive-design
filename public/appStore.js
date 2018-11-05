export const AppStore = new flux.Store();

export const PAGE_REDIRECT = 'PAGE_REDIRECT';
export const SLIDER_SETTINGS = 'SLIDER_SETTINGS';

let state = AppStore.getState();

const setState = newSettings => {
    state = AppStore.getState();
    AppStore.setState({ ...state, ...newSettings });
};

export const ActionsList = {
    [PAGE_REDIRECT]: payload => setState(payload),
    [SLIDER_SETTINGS]: payload => setState({ sliderSettings: { ...(state.sliderSettings), ...payload }})
};
