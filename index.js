"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const fs = require("fs");
const hbs = require("hbs");
const app = express();
const port = 8000;
let startTime;
app.set('view engine', 'html');
app.engine('html', hbs.__express);
const msToTime = (duration) => {
    let seconds = Math.floor(duration / 1000 % 60);
    let minutes = Math.floor(duration / (1000 * 60) % 60);
    let hours = Math.floor(duration / (1000 * 60 * 60) % 24);
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    return hours + ':' + minutes + ':' + seconds;
};
function throwNotFound(req, res, next) {
    res.status(404).render(`${__dirname}/public/404.html`);
}
app.use(express.static(__dirname + '/public'));
app.get('/status', (req, res) => {
    const currentTime = new Date().getTime();
    const difference = currentTime - startTime;
    res.send({ time: msToTime(difference) });
});
app.get('/api/events', ({ query: { type: types } }, res) => {
    let isFilterCorrect = true;
    if (types) {
        types = types.split(':');
        isFilterCorrect = types.every((type) => {
            return type === 'info' || type === 'critical';
        });
    }
    if (!isFilterCorrect) {
        res.status(400).send('Incorrect type');
        return;
    }
    fs.readFile('events.json', 'utf8', (err, content) => {
        let events = JSON.parse(content).events;
        if (types) {
            events = events.filter((event) => {
                return types.some((type) => {
                    return event.type === type;
                });
            });
        }
        res.send({ events });
    });
});
app.listen(port, () => {
    startTime = new Date().getTime();
    console.log(`Server listening on port ${port}!`);
});
app.use('*', throwNotFound);
