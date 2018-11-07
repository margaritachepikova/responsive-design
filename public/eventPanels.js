const getDataValue = (data, type) => {
    let value;
    if (data) {
        if (data.type === 'graph') {
            value = '<img src="assets/Richdata@1,5x.svg" class="image">';
        } else if (data.image) {
            value = '<img src="assets/RichdataGraphAlternative.png" class="image">';
        } else if (data.buttons) {
            value = '<div class="action-buttons">';
            data.buttons.forEach(button => {
                value += '<button type="button">' + button +'</button>';
            });
            value += '</div>';
        } else if (type === 'thermal') {
            const THERMAL_PROPERTITES = { temperature: 'Температура', humidity: 'Влажность' };
            value = '<div class="text">';
            for (let key in data) {
                value += '<div>' + THERMAL_PROPERTITES[key] + ': <span>' + data[key] + '</span></div>';
            }
            value += '</div>';
        } else {
            value = '<div class="music-data">' +
                        '<img src="assets/album-cover.png">' +
                        '<div class="player">' +
                            '<span>' + data.artist + ' - ' + data.track.name + '</span>' +
                            '<div class="slider-container">' +
                                '<input type="range" min="1" max="100" value="20" class="slider" />' +
                                '<div>' + data.track.length + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="player-controls volume">' +
                        '<div>' +
                            '<button class="prev"></button>' +
                            '<button class="next"></button>' +
                        '</div>' +
                        '<input type="range" min="1" max="100" value="' + data.volume +'" class="slider" />' +
                        '<div>' + data.volume + '% </div>' +
                    '</div>';
        }
    }
    return value;
};

const PROPERTIES = ['type', 'title', 'source', 'time', 'description', 'icon', 'data', 'size'];
const fillInWithData = (dataObject, templateHtml) => {
    let htmlSnippet, regex, value;
    PROPERTIES.forEach(property => {
        regex = new RegExp('{{' + property + '}}', 'ig');
        if (property === 'icon' && dataObject.type === 'critical') {
            value = dataObject[property] + '-white';
        } else if (property === 'data') {
            value = getDataValue(dataObject[property], dataObject.icon);
        } else {
            value = dataObject[property];
        }
        htmlSnippet = (htmlSnippet || templateHtml).replace(regex, value || '');
        value = null;
    });
    return htmlSnippet;
};

export function addEventsOnPage (dataObjects) {
    const template = document.getElementsByTagName('template')[0];
    const templateHtml = template.innerHTML;
    let listHtml = '';

    for (let i = 0; i < dataObjects.length; i++) {
        listHtml += fillInWithData(dataObjects[i], templateHtml);
    }

    document.getElementsByClassName('layout-area')[0].innerHTML += listHtml;
}
