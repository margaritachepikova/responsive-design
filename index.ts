import express = require('express');
import fs = require('fs');
import hbs = require('hbs');
const app = express();
const port = 8000;

let startTime: number;

app.set('view engine', 'html');
app.engine('html', hbs.__express);

const msToTime = (duration: number): string => {
    let seconds: string | number = Math.floor(duration / 1000 % 60);
    let minutes: string | number = Math.floor(duration / (1000 * 60) % 60);
    let hours: string | number = Math.floor(duration / (1000 * 60 * 60) % 24);

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return hours + ':' + minutes + ':' + seconds;
};

function throwNotFound(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.status(404).render(`${__dirname}/public/404.html`);
}

app.use(express.static(__dirname + '/public'));

app.get('/status', (req: express.Request, res: express.Response) => {
    const currentTime: number = new Date().getTime();
    const difference: number = currentTime - startTime;
    res.send({ time: msToTime(difference) });
});

interface IEventData {
    type: string;
    title: string;
    source: string;
    time: string;
    description: string;
    icon: string;
    size: string;
    data?: any;
}

app.get('/api/events', ({ query: { type: types }}, res: express.Response) => {
    let isFilterCorrect = true;
    if (types) {
        types = types.split(':');
        isFilterCorrect =  types.every((type: string) => {
            return type === 'info' || type === 'critical';
        });
    }
    if (!isFilterCorrect) {
        res.status(400).send('Incorrect type');
        return;
    }
    fs.readFile('events.json', 'utf8', (err: Error, content) => {
        let events = JSON.parse(content).events;
        if (types) {
            events = events.filter((event: IEventData) => {
                return types.some((type: string) => {
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
