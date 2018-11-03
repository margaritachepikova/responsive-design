import Emitter from './Emitter.js';

const STATE = 'state';
export default class Store extends Emitter {
    constructor() {
        super();
        this.state = typeof window.localStorage[STATE] !== 'undefined' ? JSON.parse(window.localStorage[STATE]) : {};
    }

    setState (newState) {
        this.state = newState;
        window.localStorage[STATE] =  JSON.stringify(this.state);
    };

    getState () {
        return this.state;
    };
}
