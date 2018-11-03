import Dispatcher from './lib/Dispatcher.js';
import Store from './lib/Store.js';

const loadJSON = (file, callback) => {
    const xobj = new XMLHttpRequest();
    xobj.open('GET', '/api/events', true);
    xobj.onreadystatechange = () => {
        if (xobj.readyState === 4 && parseInt(xobj.status, 10) === 200) {
            callback(xobj.response);
        }
    };
    xobj.send();
};

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
            const THERMAL_PROPERTITES = { temperature: 'Температура', humidity: 'Влажность'};
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
const replaceWithData = (dataObject, templateHtml) => {
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

let selectedVideo = null;
let selectedVideoContainer = null;
var videoIds = ['video-1', 'video-2', 'video-3', 'video-4'];
var videos = videoIds.map(videoId => document.getElementById(videoId));
var musicDiv = document.getElementsByClassName('music-div')[0];
const onVideoPageLoad = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const node = context.createScriptProcessor(2048, 1, 1);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.connect(node);
    node.connect(context.destination);

    const sources = [];
    videos.forEach((video, index) => {
        sources[index] = context.createMediaElementSource(video);
        sources[index].connect(analyser);
        sources[index].connect(context.destination);
    });

    node.onaudioprocess = () => {
        if (!selectedVideo) {
            return;
        }
        if (!selectedVideo.paused) {
            analyser.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((a, b) => {
                return a + b;
            });
            const avg = sum / dataArray.length;
            musicDiv.style.height = avg * 1.3 + 'px';
        }
    };
};

const initVideo = (video, url) => {
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = 'https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8';
        video.addEventListener('loadedmetadata', () => {
            video.play();
        });
    }
};

var start = () => {
    loadJSON('./events.json', (response) => {
        const dataObjects =  JSON.parse(response).events;
        const template = document.getElementsByTagName('template')[0];
        const templateHtml = template.innerHTML;
        let listHtml = '';

        for (let i = 0; i < dataObjects.length; i++) {
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

        const AppDispatcher = new Dispatcher();
        const AppStore = new Store();

        AppDispatcher.register(function (payload) {
            switch(payload.eventName) {
                case 'pageRedirect':
                    const state = AppStore.getState();
                    const pageName = payload.pageName;
                    AppStore.setState({ ...state, pageName });
                    break;
            }
        });

        const PAGE_LINKS = {
            events: document.getElementById('events-page-link'),
            videos: document.getElementById('video-page-link')
        };

        let selectedPage = AppStore.state.pageName ? PAGE_LINKS[AppStore.state.pageName] : PAGE_LINKS.events;
        selectedPage.classList.add('selected');
        const videoPageToggle = document.getElementById('video-page-toggle');

        const resetSelectedVideo = () => {
            selectedVideo.muted = true;
            selectedVideo = null;
            selectedVideoContainer.classList.remove('video-checked');
            selectedVideoContainer = null;
            videoControls.classList.remove('show');
        };

        AppStore.bind('change', () => {
            console.log('Page is changed');
        });

        Object.keys(PAGE_LINKS).forEach(key => {
            PAGE_LINKS[key].addEventListener('click', () => {
                AppDispatcher.dispatch({
                    eventName: 'pageRedirect',
                    pageName: key
                });
                AppStore.trigger('change');
                videoPageToggle.checked = key === 'videos';
                selectedPage.classList.remove('selected');
                selectedPage = PAGE_LINKS[key];
                PAGE_LINKS[key].classList.add('selected');
                if (key === 'events' && selectedVideoContainer) {
                    resetSelectedVideo();
                }
            });
        });

        const fullScreenToggle = document.getElementById('full-screen-toggle');
        const backButton = document.getElementById('back');
        backButton.addEventListener('click', () => {
            fullScreenToggle.checked = false;
            backButton.style.display = 'none';
            resetSelectedVideo();
        });


        const brightnessSlider = document.querySelector('.slider.brightness');
        const contrastSlider = document.querySelector('.slider.contrast');

        const getVideoProperties = styleFilter => {
            const filterValues = styleFilter.split(/[\s()]+/);
            filterValues.pop();
            const videoProperties = {};
            for (let i = 0; i < filterValues.length; i += 2) {
                videoProperties[filterValues[i]] = filterValues[i + 1];
            }
            return videoProperties;
        };

        const setRangeInputs = styleFilter => {
            if (!styleFilter) {
                brightnessSlider.value = 1;
                contrastSlider.value = 1;
            } else {
                const videoProperties = getVideoProperties(styleFilter);
                brightnessSlider.value = videoProperties.brightness;
                contrastSlider.value = videoProperties.contrast;
            }
        };

        const videoContainers = document.getElementsByClassName('video-container');
        const videoControls = document.getElementsByClassName('video-controls')[0];
        [].forEach.call(videoContainers, videoContainer => {
            videoContainer.addEventListener('click', event => {
                event.stopPropagation();
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

        brightnessSlider.addEventListener('change', () => {
            const checkedVideo = document.querySelector('.video-checked');
            const videoProperties = getVideoProperties(checkedVideo.style.filter);
            checkedVideo.style.filter = 'brightness(' + event.target.value +')' +
                (videoProperties.contrast ? ('contrast(' + videoProperties.contrast + ')') : '');
        });

        contrastSlider.addEventListener('change', () => {
            const checkedVideo = document.querySelector('.video-checked');
            const videoProperties = getVideoProperties(checkedVideo.style.filter);
            checkedVideo.style.filter = 'contrast(' + event.target.value +')' +
                (videoProperties.brightness ? ('brightness(' + videoProperties.brightness + ')') : '');
        });
    });
};

start();
