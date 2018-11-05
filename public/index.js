import { AppStore, ActionsList, PAGE_REDIRECT, SLIDER_SETTINGS } from './appStore.js';
import { loadJSON } from './api.js';
import { addEventsOnPage } from './eventPanels.js';

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

var start = async () => {
    const response = await loadJSON('./events.json');
    const dataObjects = JSON.parse(response).events;

    addEventsOnPage(dataObjects);

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

    const AppDispatcher = new flux.Dispatcher();

    AppDispatcher.register(({ actionType, ...payload }) => {
        ActionsList[actionType](payload);
    });

    const PAGE_LINKS = {
        events: document.getElementById('events-page-link'),
        videos: document.getElementById('video-page-link')
    };

    const { pageName, sliderSettings } = AppStore.getState();
    let selectedPage = pageName ? PAGE_LINKS[pageName] : PAGE_LINKS.events;
    selectedPage.classList.add('selected');
    const videoPageToggle = document.getElementById('video-page-toggle');
    videoPageToggle.checked = pageName === 'videos';

    const resetSelectedVideo = () => {
        selectedVideo.muted = true;
        selectedVideo = null;
        selectedVideoContainer.classList.remove('video-checked');
        selectedVideoContainer = null;
        videoControls.classList.remove('show');
    };

    AppStore.bind(PAGE_REDIRECT, () => {
        console.log('Page is changed');
    });

    Object.keys(PAGE_LINKS).forEach(key => {
        PAGE_LINKS[key].addEventListener('click', () => {
            AppDispatcher.dispatch({
                actionType: PAGE_REDIRECT,
                pageName: key
            });
            AppStore.trigger(PAGE_REDIRECT);
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
        videoContainer.style.filter = sliderSettings[videoContainer.id];
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

    AppStore.bind(SLIDER_SETTINGS, () => {
        console.log('Slider settings are changed');
    });

    const onSliderValueChange = event => {
        const checkedVideo = document.querySelector('.video-checked');
        const videoProperties = getVideoProperties(checkedVideo.style.filter);
        const slider = event.target;
        const sliderName = slider.name;
        let sliderSettings;
        const secondProperty = Object.keys(videoProperties).filter(key => key !== sliderName)[0];
        checkedVideo.style.filter = sliderSettings = sliderName + '(' + slider.value +')' +
            (videoProperties[secondProperty] ? (' ' + secondProperty + '(' + videoProperties[secondProperty] + ')') : '');

        AppDispatcher.dispatch({
            actionType: SLIDER_SETTINGS,
            [checkedVideo.id]: sliderSettings
        });
        AppStore.trigger(SLIDER_SETTINGS);
    };

    brightnessSlider.addEventListener('change', onSliderValueChange);
    contrastSlider.addEventListener('change', onSliderValueChange);
};

start();
