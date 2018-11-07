const SET_PAGE = 'SET_PAGE';
const SET_SLIDERS = 'SET_SLIDERS';

export const setPage = flux.createAction(SET_PAGE);
export const setSliders = flux.createAction(SET_SLIDERS);

const actionHandlers = {
    [SET_PAGE]: (state, payload) => ({
        ...state, pageName: payload
    }),
    [SET_SLIDERS]: (state, payload) => ({
        ...state,
        sliderSettings: {
            ...(state.sliderSettings),
            ...payload
        }
    })
};

flux.addActions(actionHandlers);
