export default class Emitter {
    constructor() {
        this.events = {};
    }

    bind (event, callback) {
        this.events[event] = this.events[event]	|| [];
        this.events[event].push(callback);
    };

    unbind (event, callback) {
        if (!this.events[event]) {
            return;
        }
        this.events[event].splice(this.events[event].indexOf(callback), 1);
    };

    trigger (event) {
        if (!this.events[event]) {
            return;
        }
        for (let i = 0; i < this.events[event].length; i++) {
            this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    };
}
