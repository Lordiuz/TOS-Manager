'use strict';

const ipc = require('electron').ipcRenderer,
    fs = require('fs');

const updatePath = document.getElementById('updatePath'),
    saveBtn = document.getElementById('saveBtn');

updatePath.addEventListener('click', function () {
    ipc.send('updatePath');
});

saveBtn.addEventListener('click', function () {
    settings.autocheck = document.getElementById('autocheck_checkbox').checked;
    settings.autoupdate = document.getElementById('autoupdate_checkbox').checked;
    fs.writeFile(path.resolve(__dirname, '..', '../settings.json'), JSON.stringify(settings), function () {
        ipc.send('saveBtn');
    });
});

ipc.on('selectedPath', function (event, path) {
    document.getElementById('settingsList').firstChild.firstChild.innerHTML = `Steam path: ${path}`;
});

const path = require('path');
const os = require('os');
var __home = path.join(os.homedir(), '/.TOSManager/');
var settings = require(path.join(__home, '/settings.json'));

document.getElementById('settingsList').innerHTML = `<div class="flex_row"><div class="flex_cell_item">Steam path: ${settings.path}</div></div>` +
    `<div class="flex_row"><div class="flex_cell_item"><input type="checkbox" id="autocheck_checkbox" ${settings.autocheck ? 'checked' : ''}><label for="autocheck_checkbox">Autocheck</label></div></div>` +
    `<div class="flex_row"><div class="flex_cell_item"><input type="checkbox" id="autoupdate_checkbox" ${settings.autoupdate ? 'checked' : ''}><label for="autoupdate_checkbox">Autoupdate</label></div></div>`;