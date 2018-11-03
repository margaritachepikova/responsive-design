export default class Dispatcher {
    constructor() {
        this.callbacks = [];
    }

    register (callback) {
        this.callbacks.push(callback);
    };

    unregister (id) {
        delete this.callbacks[id];
    };

    dispatch (payload) {
        for (let i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](payload);
        }
    };
}
