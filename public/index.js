var loadJSON = function (file, callback) {
    var xobj = new XMLHttpRequest();
    xobj.open('GET', '/api/events', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState === 4 && parseInt(xobj.status, 10) === 200) {
            callback(xobj.response);
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

var selectedVideo = null;
var selectedVideoContainer = null;
var videoIds = ['video-1', 'video-2', 'video-3', 'video-4'];
var videos = videoIds.map(function (videoId) {
    return document.getElementById(videoId);
});
var musicDiv = document.getElementsByClassName('music-div')[0];
var onVideoPageLoad = function () {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
    var node = context.createScriptProcessor(2048, 1, 1);
    var analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyser.connect(node);
    node.connect(context.destination);

    var sources = [];
    videos.forEach(function (video, index) {
        sources[index] = context.createMediaElementSource(video);
        sources[index].connect(analyser);
        sources[index].connect(context.destination);
    });

    node.onaudioprocess = function () {
        if (!selectedVideo) {
            return;
        }
        if (!selectedVideo.paused) {
            analyser.getByteFrequencyData(dataArray);
            var sum = dataArray.reduce(function(a, b) {
                return a + b;
            });
            var avg = sum / dataArray.length;
            musicDiv.style.height = avg * 1.3 + 'px';
        }
    };
};

var initVideo = function (video, url) {
    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = 'https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8';
        video.addEventListener('loadedmetadata', function () {
            video.play();
        });
    }
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

        initVideo(
            videos[0], 'http://localhost:9191/master?url=http%3A%2F%2Flocalhost%3A3102%2Fstreams%2Fsosed%2Fmaster.m3u8'
        );

        initVideo(
            videos[1], 'http://localhost:9191/master?url=http%3A%2F%2Flocalhost%3A3102%2Fstreams%2Fcat%2Fmaster.m3u8'
        );

        initVideo(
            videos[2], 'http://localhost:9191/master?url=http%3A%2F%2Flocalhost%3A3102%2Fstreams%2Fdog%2Fmaster.m3u8'
        );

        initVideo(
            videos[3], 'http://localhost:9191/master?url=http%3A%2F%2Flocalhost%3A3102%2Fstreams%2Fhall%2Fmaster.m3u8'
        );

        onVideoPageLoad();

        var pageLinks = {
            events: document.getElementById('events-page-link'),
            videos: document.getElementById('video-page-link')
        };

        var selectedPage = pageLinks.events;
        var videoPageToggle = document.getElementById('video-page-toggle');

        var resetSelectedVideo = function () {
            selectedVideo.muted = true;
            selectedVideo = null;
            selectedVideoContainer.classList.remove('video-checked');
            selectedVideoContainer = null;
            videoControls.classList.remove('show');
        };

        var menuButton = document.getElementsByClassName('menu-button')[0];
        Object.keys(pageLinks).forEach(function (key) {
            pageLinks[key].addEventListener('click', function () {
                videoPageToggle.checked = key === 'videos';
                selectedPage.classList.remove('selected');
                selectedPage = pageLinks[key];
                pageLinks[key].classList.add('selected');
                if (key === 'events' && selectedVideoContainer) {
                    resetSelectedVideo();
                }
                menuButton.checked = false;
            });
        });

        var fullScreenToggle = document.getElementById('full-screen-toggle');
        var backButton = document.getElementById('back');
        backButton.addEventListener('click', function () {
            fullScreenToggle.checked = false;
            backButton.style.display = 'none';
            resetSelectedVideo();
        });


        var brightnessSlider = document.querySelector('.slider.brightness');
        var contrastSlider = document.querySelector('.slider.contrast');

        var getVideoProperties = function (styleFilter) {
            var filterValues = styleFilter.split(/[\s()]+/);
            filterValues.pop();
            var videoProperties = {};
            for (var i = 0; i < filterValues.length; i += 2) {
                videoProperties[filterValues[i]] = filterValues[i + 1];
            }
            return videoProperties;
        };

        var setRangeInputs = function (styleFilter) {
            if (!styleFilter) {
                brightnessSlider.value = 1;
                contrastSlider.value = 1;
            } else {
                var videoProperties = getVideoProperties(styleFilter);
                brightnessSlider.value = videoProperties.brightness;
                contrastSlider.value = videoProperties.contrast;
            }
        };

        var videoContainers = document.getElementsByClassName('video-container');
        var videoControls = document.getElementsByClassName('video-controls')[0];
        [].forEach.call(videoContainers, function (videoContainer) {
            videoContainer.addEventListener('click', function (event) {
                event.stopPropagation();
                // event.preventDefault();
                if (selectedVideoContainer) {
                    return;
                }
                fullScreenToggle.checked = true;
                videoContainer.classList.add('video-checked');
                selectedVideo = document.querySelector('.video-checked video');
                selectedVideoContainer = videoContainer;
                selectedVideo.muted = false;
                videoControls.classList.add('show');
                backButton.style.display = 'block';
                setRangeInputs(videoContainer.style.filter);
            });
        });

        brightnessSlider.addEventListener('change', function () {
            var checkedVideo = document.querySelector('.video-checked');
            var videoProperties = getVideoProperties(checkedVideo.style.filter);
            checkedVideo.style.filter = 'brightness(' + event.target.value +')' +
                (videoProperties.contrast ? ('contrast(' + videoProperties.contrast + ')') : '');
        });

        contrastSlider.addEventListener('change', function () {
            var checkedVideo = document.querySelector('.video-checked');
            var videoProperties = getVideoProperties(checkedVideo.style.filter);
            checkedVideo.style.filter = 'contrast(' + event.target.value +')' +
                (videoProperties.brightness ? ('brightness(' + videoProperties.brightness + ')') : '');
        });
    });
};

start();
