var loadJSON = function (file, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType('application/json');
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState === 4 && parseInt(xobj.status, 10) === 200) {
            callback(xobj.responseText);
        }
    };
    xobj.send();
};

var getDataValue = function (data, type) {
    var value;
    if (data) {
        if (data.type === 'graph') {
            value = '<img src="assets/Richdata@1,5x.svg" class="image">';
        } else if (data.image) {
            value = '<img src="assets/RichdataGraphAlternative.png" class="image">';
        } else if (data.buttons) {
            value = '<div class="action-buttons">';
            data.buttons.forEach(function (button) {
                value += '<button type="button">' + button +'</button>';
            });
            value += '</div>';
        } else if (type === 'thermal') {
            var THERMAL_PROPERTITES = { temperature: 'Температура', humidity: 'Влажность'};
            value = '<div class="text">';
            for (var key in data) {
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

var PROPERTIES = ['type', 'title', 'source', 'time', 'description', 'icon', 'data', 'size'];
var replaceWithData = function (dataObject, templateHtml) {
    var htmlSnippet, regex, value;
    PROPERTIES.forEach(function (property) {
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

var start = function () {
    loadJSON('./events.json', function (response) {
        var dataObjects =  JSON.parse(response).events;
        var template = document.getElementsByTagName('template')[0];
        var templateHtml = template.innerHTML;
        var listHtml = '';

        for (var i = 0; i < dataObjects.length; i++) {
            listHtml += replaceWithData(dataObjects[i], templateHtml);
        }

        document.getElementsByClassName('layout-area')[0].innerHTML += listHtml;
    });
};

start();
