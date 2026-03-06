'use strict';

const ipc = require('electron').ipcRenderer;
const renderAddons = require('./addonsRenderPure');

const checkBtn = document.getElementById('checkBtn'),
    settingsBtn = document.getElementById('settingsBtn'),
    installBtn = document.getElementById('installBtn'),
    removeBtn = document.getElementById('removeBtn'),
    updateBtn = document.getElementById('updateBtn'),
    notifBtn = document.getElementById('notifBtn');

notifBtn.addEventListener('click', function () {
    ipc.send('notificationCheck');
});

checkBtn.addEventListener('click', function () {
    ipc.send('updateCheck');
});

settingsBtn.addEventListener('click', function () {
    ipc.send('settingsBtn');
});

installBtn.addEventListener('click', function () {
    ipc.send('installAddons');
});

updateBtn.addEventListener('click', function () {
    ipc.send('updateAddons');
});

removeBtn.addEventListener('click', function () {
    ipc.send('removeAddons');
});

ipc.on('updateFound', function (event, addon) {
    console.log(addon);
    var elem = document.getElementById('addon_' + addon['id']);
    elem && elem.classList.add('outofdate');
    updateBtn && updateBtn.classList.remove('hidden');
});

ipc.on('addonUpdated', function (event, addon) {
    var elem = document.getElementById('addon_' + addon['id']);
    elem && elem.classList.remove('outofdate');
});

ipc.on('addonIntalled', function (event, addon) {
    var elem = document.getElementById('addon_' + addon['id']);
    elem && elem.classList.add('installed');
});

ipc.on('addonRemoved', function (event, addon) {
    var elem = document.getElementById('addon_' + addon['id']);
    elem && elem.classList.remove('installed');
});

ipc.on('addonsRemoved', function (event, __addons) {
    addons = __addons;
    isRemovebleAddons();
    isInstallableAddons();
    console.warn('All addons removed');
});

ipc.on('addonsInstalled', function (event, __addons) {
    addons = __addons;
    isInstallableAddons();
    isRemovebleAddons();
    console.warn('All addons installed');
});

ipc.on('addonsUpdated', function (event, __addons) {
    addons = __addons;
    isInstallableAddons();
    isUpdatableAddons();
    isRemovebleAddons();
    console.warn('All addons updated');
});

ipc.on('updateProgressStart', function (event, length) {
    var updateProgress = document.getElementById('updateProgress');
    updateProgress.max = length;
});

ipc.on('updateProgress', function (event, value) {
    var updateProgress = document.getElementById('updateProgress');
    updateProgress.value = value;
});

ipc.on('selectedPath', function (event, path) {
    document.getElementById('folderPath').innerHTML = `Steam path: ${path}`;
});

const path = require('path');
const os = require('os');
var __home = path.join(os.homedir(), '/.TOSanager/');
var settings = require(path.join(__home, '/settings.json'));
var addons = require(path.join(__home, '/addons.json'));
var core = require(path.join(__home, '/core.json'));
var profiles = require(path.join(__home, '/profiles.json'));
var addonList = document.getElementById('addonList');

var addonListShow = function (elem) {
    var list = document.getElementById(elem.id + 's');
    list && list.classList.toggle('addon_list_details');
    elem && elem.classList.toggle('open');
};

var addonUpdate = function (id) {
    ipc.send('addonUpdate', id);
};

var addonInstall = function (id) {
    ipc.send('addonInstall', id);
};

var addonRemove = function (id) {
    ipc.send('addonRemove', id);
};

function addonsRender (callback) {
    addonList.innerHTML += renderAddons(addons, profiles);
    callback();
}

function isInstallableAddons () {
    var check = profiles.some(function (elem) {
        return !elem.installed;
    });
    if (check) {
        installBtn && installBtn.classList.remove('hidden');
    } else {
        installBtn && installBtn.classList.add('hidden');
    }
}

function isUpdatableAddons () {
    var check = profiles.some(function (elem) {
        return elem.installed && elem.latest > elem.installed;
    });
    if (check) {
        updateBtn && updateBtn.classList.remove('hidden');
    } else {
        updateBtn && updateBtn.classList.add('hidden');
    }
}

function isRemovebleAddons () {
    var check = profiles.some(function (elem) {
        return elem.installed;
    });
    if (check) {
        removeBtn && removeBtn.classList.remove('hidden');
    } else {
        removeBtn && removeBtn.classList.add('hidden');
    }
}

isInstallableAddons();
isUpdatableAddons();
isRemovebleAddons();

addonsRender(function () {
    ipc.send('autoUpdate');
    //win.setContentSize(document.body.clientWidth, document.body.clientHeight);
});


var socket = io.connect('http://nodejs.app');

socket.on('connect', function () {
    console.log("Соединение установлено");
    socket.emit('manager', function (version) {
        console.log(version);
        if (version > settings.version) {
            ipc.send('updating');
        }
    });
}).on('disconnect', function () {
    console.log("Соединение потеряно");
}).on('logout', function () {
}).on('error', function (reason) {
}).on('updating', function () {
    ipc.send('updating');
}).on('coreUpdate', function () {
    console.log("coreUpdate");
});