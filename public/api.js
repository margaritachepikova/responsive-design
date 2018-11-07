export function loadJSON (file, callback) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', '/api/events', true);
        request.onreadystatechange = () => {
            if (request.readyState !== 4) {
                return;
            }
            if (request.status >= 200 && request.status < 300) {
                resolve(request.response);
            } else {
                reject({
                    status: request.status,
                    statusText: request.statusText
                });
            }
        };
        request.send();
    });
}
