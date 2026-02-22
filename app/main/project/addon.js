const path = require('path'),
    fs_extra = require('fs-extra'),
    fs = require('fs'),
    yauzl = require("yauzl"),
    https = require('https'),
    http = require('http'),
    url = require('url'),
    zips = path.join(__home, '/zips'),
    tmp = path.join(__home, '/tmp'),
    backup = path.join(__home, '/backup');

module.exports = {
    downloadAndUnzip:   function (addon, id, callback) {
        var self = this;
        if (addon.downloads) {
            let link = addon.downloads[id];
            if (link) {
                self.downloadAddon(addon, link, function (file, zipped) {
                    if (file && zipped) {
                        self.unzipAddon(file, addon, function () {
                            self.downloadAndUnzip(addon, ++id, callback);
                        });
                    } else {
                        self.downloadAndUnzip(addon, ++id, callback);
                    }
                });
            } else {
                callback && callback();
            }
        } else {
            self.downloadAddon(addon, null, function (file, zipped) {
                self.unzipAddon(file, addon, function () {
                    callback && callback();
                });
            });
        }
    },
    checkReleases:      function (addon, callback) {
        var options = {
            host:    'api.github.com',
            path:    '/repos/' + addon.url + '/releases/latest?_=' + Date.now() + '&client_id=41a83f7feb801b6b8dc3&client_secret=9b2c36ad17014d65fcf5d4133543cb02f0157ad5',
            headers: {
                'Accept':        'application/json',
                'User-Agent':    'TOS Manager',
                'Cache-Control': 'no-cache'
            }
        };

        this.redirectCheck(options, function (err, data) {
            if (data) {
                callback(null, JSON.parse(data));
            } else {
                callback(null, null);
            }
        });
    },
    checkMaster:        function (addon, callback) {
        var options = {
            host:    'api.github.com',
            path:    '/repos/' + addon.url + '?_=' + Date.now() + '&client_id=41a83f7feb801b6b8dc3&client_secret=9b2c36ad17014d65fcf5d4133543cb02f0157ad5',
            headers: {
                'Accept':        'application/json',
                'User-Agent':    'TOS Manager',
                'Cache-Control': 'no-cache'
            }
        };

        this.redirectCheck(options, function (err, data) {
            if (data) {
                callback(null, JSON.parse(data));
            } else {
                callback(null, null);
            }
        });
    },
    downloadAddon:      function (addon, link, callback) {
        var options, name;
        if (link) {
            options = {
                host:    'api.github.com',
                path:    link + '?client_id=41a83f7feb801b6b8dc3&client_secret=9b2c36ad17014d65fcf5d4133543cb02f0157ad5',
                headers: {
                    'Accept':     'application/octet-stream',
                    'User-Agent': 'TOS Manager'
                }
            };
        } else {
            options = {
                host:    'api.github.com',
                path:    '/repos/' + addon.url + '/zipball/master?client_id=41a83f7feb801b6b8dc3&client_secret=9b2c36ad17014d65fcf5d4133543cb02f0157ad5',
                headers: {
                    'User-Agent': 'TOS Manager'
                }
            };
        }

        this.redirectCheck(options, function (err, data, res) {
            if (data) {
                let path = require('path'), name = res.headers['content-disposition'].replace(new RegExp('.*filename=', 'y'), ''), zipped, file;
                if (name.replace(new RegExp('.*\\.', 'y'), '') === 'zip') {
                    zipped = true;
                    file = path.join(zips, name);
                } else {
                    zipped = false;
                    file = path.join(tmp, name);
                }
                fs_extra.outputFile(file, new Buffer(data, 'binary'), function () {
                    callback(file, zipped);
                });
            } else {
                callback(null);
            }
        }, 'binary');
    },
    unzipAddon:         function (file, addon, callback) {
        var self = this;
        yauzl.open(file, {autoClose: false, lazyEntries: true}, function (err, zipfile) {
            if (err) throw err;
            zipfile.readEntry();
            zipfile.on("entry", function (entry) {
                var fileName;
                if (!addon.released) {
                    fileName = entry.fileName.replace(/.*?\//, '');
                } else {
                    fileName = entry.fileName;
                }
                if (fileName) {
                    if (/\/$/.test(fileName)) {
                        // directory file names end with '/'
                        fs_extra.mkdirs(tmp + '/' + fileName, function (err) {
                            if (err) throw err;
                            zipfile.readEntry();
                        });
                    } else {
                        // file entry
                        zipfile.openReadStream(entry, function (err, readStream) {
                            if (err) throw err;
                            // ensure parent directory exists
                            fs_extra.mkdirs(path.dirname(tmp + '/' + fileName), function (err) {
                                if (err) throw err;
                                readStream.pipe(fs.createWriteStream(tmp + '/' + fileName));
                                readStream.on("end", function () {
                                    zipfile.readEntry();
                                });
                            });
                        });
                    }
                } else {
                    zipfile.readEntry();
                }
            });
            zipfile.once("end", function () {
                zipfile.close();
                callback();
            });
        });
    },
    checkAddon:         function (id, callback, complite) {
        var addon = __addons[id], self = this;
        __window.webContents.send('updateProgress', (id + 1));
        if (addon) {
            if (addon.released) {
                self.checkReleases(addon, function (err, data) {
                    if (data) {
                        console.log(data);
                        addon.downloads = [];
                        if (data['assets'] && data['assets'].length) {
                            data['assets'].forEach(function (item) {
                                let link = url.parse(item['url']);
                                addon.downloads.push(link['path']);
                            });
                        }
                        if (!addon.latest || data['tag_name'] > addon.latest) {
                            addon.latest = data['tag_name'];
                            callback(null, true, addon, callback, complite);
                        } else {
                            callback(null, false, addon, callback, complite);
                        }
                    } else {
                        callback(null, false, addon, callback, complite);
                    }
                });
            } else {
                self.checkMaster(addon, function (err, data) {
                    if (!addon.latest || data['pushed_at'] > addon.latest) {
                        addon.latest = data['pushed_at'];
                        callback(null, true, addon, callback, complite);
                    } else {
                        callback(null, false, addon, callback, complite);
                    }
                });
            }
        } else {
            complite && complite();
        }
    },
    checkAddons:        function () {
        var id = 0, self = this;
        __window.webContents.send('updateProgressStart', __addons.length);

        self.checkReleases(__core, function (err, data) {
            var link = url.parse(data['assets'][0]['url']);
            if (data['tag_name'] > __core.latest) {
                __core.download = link['path'];
                __core.latest = data['tag_name'];
                //self.downloadAddon(__core, function (file) {
                let file = path.join(zips, __core.name + '.zip');
                self.unzipAddon(file, function () {
                    self.modeMove(__core, 0, function () {
                        fs_extra.emptyDir(tmp, function () {
                            __core.installed = data['tag_name'];
                            fs_extra.readJson(path.join(__home, '/addons.json'), function (err, data) {
                                global.__addons = data;
                                self.checkAddon(id, function (err, outofdate, addon, callback, complite) {
                                    __window.webContents.send('updateProgress', (id + 1));
                                    if (outofdate) {
                                        addon['installed'] && __window.webContents.send('updateFound', addon);
                                        self.checkAddon(++id, callback, complite);
                                    } else {
                                        self.checkAddon(++id, callback, complite);
                                    }
                                }, function () {
                                    __window.webContents.send('addonsChecked', __addons);
                                });
                            });
                        });
                    });
                });
                //})
            } else {
                self.checkAddon(id, function (err, outofdate, addon, callback, complite) {
                    __window.webContents.send('updateProgress', (id + 1));
                    if (outofdate && addon.installed) {
                        __window.webContents.send('updateFound', addon);
                        __notification({text: 'There is new version of ' + addon.name + ' available!'});
                        self.checkAddon(++id, callback, complite);
                    } else {
                        self.checkAddon(++id, callback, complite);
                    }
                }, function () {
                    __window.webContents.send('addonsChecked', __addons);
                });
            }
        });
    },
    installAddon:       function (id, callback, complite) {
        var addon = __addons[id], profile = __profiles[id], self = this;
        if (addon) {
            if (!profile.installed) {
                self.backupFiles(addon, 0, function () {
                    self.downloadAndUnzip(addon, 0, function () {
                        self.modeMove(addon, 0, function () {
                            self.addonRequiredMove(addon, 0, function () {
                                profile.installed = addon.latest;
                                callback(null, true, addon, callback, complite);
                            });
                        });
                    });
                });
            } else {
                callback(null, false, addon, callback, complite);
            }
        } else {
            complite && complite();
        }
    },
    installAddons:      function (callback) {
        var id = 0, self = this;
        __window.webContents.send('updateProgressStart', __addons.length);

        self.installAddon(id, function (err, installed, addon, callback, complite) {
            __window.webContents.send('updateProgress', (id + 1));
            if (installed) {
                __window.webContents.send('addonIntalled', addon);
                self.installAddon(++id, callback, complite);
            } else {
                self.installAddon(++id, callback, complite);
            }
        }, function () {
            callback && callback();
            __window.webContents.send('addonsInstalled', __addons);
        });
    },
    updateAddon:        function (id, callback, complite) {
        var addon = __addons[id], self = this;
        if (addon) {
            if (addon.downloads && addon.installed && addon.latest > addon.installed) {
                self.removeAddon(id, function (err, installed) {
                    if (installed) {
                        self.installAddon(id, function (err, removed) {
                            if (removed) {
                                callback(null, true, addon, callback, complite);
                            } else {
                                callback(null, false, addon, callback, complite);
                            }
                        });
                    } else {
                        callback(null, false, addon, callback, complite);
                    }
                });
            } else {
                callback(null, false, addon, callback, complite);
            }
        } else {
            complite && complite();
        }
    },
    updateAddons:       function (callback) {
        var id = 0, self = this;
        __window.webContents.send('updateProgressStart', __addons.length);

        self.updateAddon(id, function (err, installed, addon, callback, complite) {
            __window.webContents.send('updateProgress', (id + 1));
            if (installed) {
                __window.webContents.send('addonUpdated', addon);
                self.updateAddon(++id, callback, complite);
            } else {
                self.updateAddon(++id, callback, complite);
            }
        }, function () {
            callback && callback();
            __window.webContents.send('addonsUpdated', __addons);
        });
    },
    removeAddon:        function (id, callback, complite) {
        var addon = __addons[id], profile = __profiles[id], self = this;
        if (addon) {
            if (profile.installed) {
                self.removeMode(addon, 0, function () {
                    self.removeRequiredFile(addon, 0, function () {
                        self.restoreFiles(addon, 0, function () {
                            profile.installed = false;
                            callback(null, true, addon, callback, complite);
                        });
                    });
                });
            } else {
                callback(null, false, addon, callback, complite);
            }
        } else {
            complite && complite();
        }
    },
    removeAddons:       function (callback) {
        var id = 0, self = this;
        __window.webContents.send('updateProgressStart', __addons.length);

        self.removeAddon(id, function (err, installed, addon, callback, complite) {
            __window.webContents.send('updateProgress', (id + 1));
            if (installed) {
                __window.webContents.send('addonRemoved', addon);
                self.removeAddon(++id, callback, complite);
            } else {
                self.removeAddon(++id, callback, complite);
            }
        }, function () {
            callback && callback();
            __window.webContents.send('addonsRemoved', __addons);
        });
    },
    removeMode:         function (addon, id, callback) {
        var mode = addon.modes && addon.modes[id], mode_install = __profiles[addon.id] && __profiles[addon.id].modes && __profiles[addon.id].modes[id], self = this;
        if (mode) {
            self.removeModeFile(mode, 0, function () {
                mode_install.installed = false;
                self.removeMode(addon, ++id, callback);
            });
        } else {
            callback();
        }
    },
    removeModeFile:     function (mode, id, callback) {
        var file = mode.files && mode.files[id], self = this;
        if (file) {
            if (typeof file === 'string') {
                fs_extra.remove(path.join(__settings.folder, file), function (err) {
                    self.removeModeFile(mode, ++id, callback);
                });
            } else {
                fs_extra.remove(path.join(__settings.folder, file.dest), function (err) {
                    self.removeModeFile(mode, ++id, callback);
                });
            }
        } else {
            callback();
        }
    },
    removeRequiredFile: function (addon, id, callback) {
        var file = addon.required && addon.required[id], self = this;
        if (file) {
            if (typeof file === 'string') {
                fs_extra.remove(path.join(__settings.folder, file), function (err) {
                    self.removeRequiredFile(addon, ++id, callback);
                });
            } else {
                fs_extra.remove(path.join(__settings.folder, file.dest), function (err) {
                    self.removeRequiredFile(addon, ++id, callback);
                });
            }
        } else {
            callback();
        }
    },
    modeMove:           function (addon, id, callback) {
        var mode = addon.modes && addon.modes[id], mode_install = __profiles[addon.id] && __profiles[addon.id].modes && __profiles[addon.id].modes[id], self = this;
        if (mode) {
            self.modeFileMove(mode, 0, function () {
                mode_install.installed = addon.latest;
                self.modeMove(addon, ++id, callback);
            });
        } else {
            callback();
        }
    },
    modeFileMove:       function (mode, id, callback) {
        var file = mode.files && mode.files[id], self = this;
        if (file) {
            self.fileMoving(file, function (err) {
                self.modeFileMove(mode, ++id, callback);
            });
        } else {
            callback();
        }
    },
    addonRequiredMove:  function (addon, id, callback) {
        var file = addon.required && addon.required[id], self = this;
        if (file) {
            self.fileMoving(file, function (err) {
                self.addonRequiredMove(addon, ++id, callback);
            });
        } else {
            callback();
        }
    },
    fileMoving:         function (file, callback) {
        if (typeof file === 'string') {
            fs_extra.copy(path.join(tmp, file), path.join(__settings.folder, file), {clobber: true}, callback);
        } else {
            fs_extra.copy(path.join(tmp, file.src), path.join(__settings.folder, file.dest), {clobber: true}, callback);
        }
    },
    backupFiles:        function (addon, id, callback) {
        var file = addon.backup && addon.backup[id], self = this;
        if (file) {
            if (typeof file === 'string') {
                fs_extra.copy(path.join(__settings.folder, file), path.join(backup, file), {clobber: true}, function (err) {
                    self.backupFiles(addon, ++id, callback);
                });
            } else {
                fs_extra.copy(path.join(__settings.folder, file.src), path.join(backup, file.dest), {clobber: true}, function (err) {
                    self.backupFiles(addon, ++id, callback);
                });
            }
        } else {
            callback();
        }
    },
    restoreFiles:       function (addon, id, callback) {
        var file = addon.backup && addon.backup[id], self = this;
        if (file) {
            if (typeof file === 'string') {
                fs_extra.copy(path.join(backup, file), path.join(__settings.folder, file), {clobber: true}, function (err) {
                    self.backupFiles(addon, ++id, callback);
                });
            } else {
                fs_extra.copy(path.join(backup, file.src), path.join(__settings.folder, file.dest), {clobber: true}, function (err) {
                    self.backupFiles(addon, ++id, callback);
                });
            }
        } else {
            callback();
        }
    },
    redirectCheck:      function (options, callback, encoding = 'utf8') {
        https.get(options, (res) => {
            var data = "", self = this;
            res.setEncoding(encoding);
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', function () {
                if (res.headers['status'] === '301 Moved Permanently' || res.headers['status'] === '302 Moved Temporarily' || res.headers['status'] === '307 Temporary Redirect' || res.headers['status'] === '302 Found') {
                    let link = url.parse(res.headers['location']);
                    options.path = link.path;
                    options.host = link.host;
                    self.redirectCheck(options, callback, encoding);
                } else {
                    if (data) {
                        callback(null, data, res);
                    } else {
                        callback(null, null, res);
                    }
                }
            });
        });
    },
    coreLoad:           function (callback) {
        http.get('http://nodejs.app/public/manager/addons.zip', (res) => {
            var data = "", self = this;
            res.setEncoding('binary');
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', function () {
                fs_extra.outputFile(path.join(zips, '/core.zip'), new Buffer(data, 'binary'), callback);
            });
        });
    },
    coreUpdate:         function (callback) {
        var self = this;
        self.coreRemove(function () {
            self.coreInstall(function () {
                callback(null, true);
            });
        });
    },
    coreRemove:         function (callback) {
        var self = this;
        self.removeMode(__core, 0, function () {
            self.removeRequiredFile(__core, 0, function () {
                self.restoreFiles(__core, 0, function () {
                    __core.installed = false;
                    callback && callback(null, true);
                });
            });
        });
    },
    coreInstall:        function (callback) {
        var self = this;
        self.backupFiles(__core, 0, function () {
            self.coreLoad(function () {
                self.unzipAddon(path.join(zips, '/core.zip'), __core, function () {
                    self.modeMove(__core, 0, function () {
                        self.addonRequiredMove(__core, 0, function () {
                            __core.installed = __core.latest;
                            callback && callback(null, true);
                        });
                    });
                });
            });
        });
    },
    coreCheck:          function (work, callback) {
        var self = this, installed = __profiles.filter(function (item) {
            return item.installed;
        });
        self[work](function () {
            var installedNew = __profiles.filter(function (item) {
                return item.installed;
            });
            if(installed.length === 0 && installedNew.length > 0) {
                self.coreInstall(callback);
            } else if (installed.length > 0 && installedNew.length === 0) {
                self.coreRemove(callback);
            }
        });
    }
};
