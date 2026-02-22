'use strict';

const fs_extra = require('fs-extra'),
    path = require('path'),
    electron = require('electron');

module.exports = function () {
    const ipc = electron.ipcMain,
        addon_api = require('./addon_api');

    ipc.on('updateCheck', function (event) {
        addon_api.checkAddons();
    });

    ipc.on('updateAddons', function (event) {
        addon_api.updateAddons();
    });

    ipc.on('addonUpdate', function (event, id) {
        addon_api.updateAddon(id, function () {
            __window.webContents.send('addonUpdated', {id: id});
        });
    });

    ipc.on('installAddons', function (event) {
        addon_api.coreCheck('installAddons');
    });

    ipc.on('addonInstall', function (event, id) {
        addon_api.installAddon(id, function () {
            __window.webContents.send('addonIntalled', {id: id});
        });
    });

    ipc.on('removeAddons', function (event) {
        addon_api.coreCheck('removeAddons');
    });

    ipc.on('addonRemove', function (event, id) {
        addon_api.removeAddon(id, function () {
            __window.webContents.send('addonRemoved', {id: id});
        });
    });

    ipc.on('notificationCheck', function (event, id) {
        //__notification({text: 'SomeOne text'});
        var modeCheck = function (id, addon, profile, callback) {
            var mode = addon.modes && addon.modes[id], mode_prof = profile.modes && profile.modes[id];
            if (mode) {
                if (mode_prof) {
                    modeCheck(++id, addon, profile, callback);
                } else {
                    profile.modes.push({installed: false});
                    modeCheck(id, addon, profile, callback);
                }
            } else {
                callback && callback();
            }

        }, addonCheck = function (id, callback) {
            var addon = __addons[id], profile = __profiles[id];
            if (addon) {
                if (profile) {
                    modeCheck(0, addon, profile, function () {
                        addonCheck(++id, callback);
                    });
                } else {
                    __profiles.push({installed: false, modes: []});
                    addonCheck(id, callback);
                }
            } else {
                callback && callback();
            }
        };
        addonCheck(0, function () {
            __notification({text: 'Ура епта!'});
        });
    });

    ipc.on('mainShow', function (event, id) {
        __window.show();
    });

    ipc.on('profileCheck', function (event, id) {
        var modeCheck = function (id, addon, profile, callback) {
            var mode = addon.modes && addon.modes[id], mode_prof = profile.modes && profile.modes[id];
            if (mode) {
                if (mode_prof) {
                    modeCheck(++id, addon, profile, callback);
                } else {
                    mode_prof.push({installed: false});
                    modeCheck(id, addon, profile, callback);
                }
            } else {
                callback && callback();
            }

        }, addonCheck = function (id, callback) {
            var addon = __addons[id], profile = __profiles[id];
            if (addon) {
                if (profile) {
                    modeCheck(0, addon, profile, function () {
                        addonCheck(++id, callback);
                    });
                } else {
                    profile.push({installed: false, modes: []});
                    addonCheck(id, callback);
                }
            } else {
                callback && callback();
            }
        }
    });

    ipc.on('settingsBtn', function (event) {
        __window.loadURL(path.join('file://', __dirname, '/public/html/settings.html'));
    });

    ipc.on('saveBtn', function (event) {
        fs_extra.readJson('./settings.json', function (err, data) {
            __settings.autocheck = data.autocheck;
            __settings.autoupdate = data.autoupdate;
            __window.loadURL(path.join('file://', __dirname, '/public/html/index.html'));
        });
    });

    ipc.on('updatePath', function (event) {
        const dialog = require('electron').dialog;
        dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        }, function (files) {
            if (files) {
                __settings.path = files[0];
                __settings.folder = files[0] + '\\steamapps\\common\\TreeOfSavior';
                event.sender.send('selectedPath', files);
            }
        })
    });

    ipc.on('autoUpdate', function (event, arg) {
        __settings.autocheck && addon_api.checkAddons();
        if (__settings.autoupdate) {
            setInterval(function () {
                addon_api.checkAddons();
            }, (__settings.delay || 1800000));
        }
    });
};
