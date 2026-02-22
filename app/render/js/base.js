'use strict';

/************* BASE *******************/

const BrowserWindow = require('electron').remote;
const win = BrowserWindow.getCurrentWindow();

function closeWindow () {
    win.close();
}

function minimizeWindow () {
    win.minimize();
}

var window_maximize = document.getElementById('window_maximize');

function maximizeWindow () {
    win.maximize();
    window_maximize.title = 'Restore';
    window_maximize.classList.toggle('open');
    window_maximize.onclick = unmaximizeWindow;
}

function unmaximizeWindow () {
    win.unmaximize();
    window_maximize.title = 'Maximize';
    window_maximize.classList.toggle('open');
    window_maximize.onclick = maximizeWindow;
}


function initDrag (e) {
    var startX = e.clientX,
        startY = e.clientY,
        doDrag = function (e) {
            var position = win.getPosition();
            win.setPosition(position[0] + e.clientX - startX, position[1] + e.clientY - startY);
        },
        stopDrag = function (e) {
            document.documentElement.removeEventListener('mousemove', doDrag, false);
            document.documentElement.removeEventListener('mouseup', stopDrag, false);
        };
    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
}

var window_title = document.getElementById('window_title');

window_title.addEventListener('mousedown', initDrag, true);