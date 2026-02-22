'use strict';

const ipc = require('electron').ipcRenderer;

ipc.on('notificationText', function (event, data) {
    document.querySelector('.notification_text').innerHTML = data.text;
});

function showMain () {
    ipc.send('mainShow');
    win.close();
    return false;
}