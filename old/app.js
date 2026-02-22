const path = require('path'),
    electron = require('electron'),
    fs_extra = require('fs-extra'),
    os = require('os'),
    BrowserWindow = electron.BrowserWindow,
    app = electron.app;

global.__api = function (...args) {
    send('api', ...args)
};

global.__log = function (...args) {
    send('log', ...args)
};

global.__window = null;

var appIcon = null;

console.dir({a: 1});

function initialize () {
    var shouldQuit = makeSingleInstance();
    if (shouldQuit) return app.quit();

    //autoUpdater.updateMenu();

    function createWindow () {
        var windowOptions = {
            width:           650,
            height:          500,
            minWidth:        500,
            minHeight:       400,
            maxWidth:        900,
            maxHeight:       700,
            icon:            path.join(__dirname, '/public/icon/win/icon.ico'),
            title:           'TOSanager',
            autoHideMenuBar: true,
            frame:           false,
            //show:            false,
            useContentSize:  true,
            hasShadow:       false
        };

        global.__window = new BrowserWindow(windowOptions);

        //__window.setMenu(null);

        __window.loadURL(path.join('file://', __dirname, '/public/html/index.html'));
        // Open the DevTools.
        __window.webContents.openDevTools();

        __window.on('minimize', function (event) {
            event.preventDefault();
            __window.hide();
        });

        __window.on('close', function () {
            var fs = require('fs');
            fs.writeFileSync(path.join(__home, '/settings.json'), JSON.stringify(__settings));
            fs.writeFileSync(path.join(__home, '/core.json'), JSON.stringify(__core));
            fs.writeFileSync(path.join(__home, '/profiles.json'), JSON.stringify(__profiles));
            appIcon.destroy();
        });

        __window.on('closed', function () {
            __window = null;
        });

        __window.webContents.once('dom-ready', function () {
            const iconPath = path.join(__dirname, '/public/icon/win/icon.ico');
            appIcon = new electron.Tray(iconPath);
            const contextMenu = electron.Menu.buildFromTemplate([
                {
                    label: 'Show',
                    click: function (menuItem, browserWindow) {
                        __window.show();
                    }
                },
                {
                    label: 'Exit',
                    click: function (menuItem, browserWindow) {
                        __window.close();
                    }
                }
            ]);
            appIcon.on('double-click', function () {
                __window.show();
            });
            appIcon.setToolTip('TOSanager');
            appIcon.setContextMenu(contextMenu);

            global.__notification = function (data) {
                var screenSize = electron.screen.getPrimaryDisplay().workAreaSize,
                    windowOptions = {
                        width:           300,
                        height:          100,
                        icon:            path.join(__dirname, '/public/icon/win/icon.ico'),
                        title:           'TOSanager Notification',
                        autoHideMenuBar: true,
                        resizable:       false,
                        useContentSize:  true,
                        movable:         false,
                        closable:        false,
                        maximizable:     false,
                        minimizable:     false,
                        frame:           false,
                        skipTaskbar:     true,
                        alwaysOnTop:     true,
                        show:            false,
                        x:               (screenSize.width - 305),
                        y:               (screenSize.height - 105)
                    },
                    notification = new BrowserWindow(windowOptions);
                notification.setMenu(null);
                //notification.webContents.openDevTools();
                notification.loadURL(path.join('file://', __dirname, '/public/html/notification.html'));
                notification.webContents.on('did-finish-load', function () {
                    notification.show();
                    notification.webContents.send('notificationText', data);
                    setTimeout(function () {
                        notification && notification.destroy();
                    }, 10000);
                });
            }
        });

        require('./main')();
    }

    function createInstance () {
        global.__home = path.join(os.homedir(), '/.TOSanager/');
        fs_extra.readJson(path.join(__home, '/settings.json'), function (err, data) {
            if (!data) {
                global.__settings = {
                    path:       "",
                    folder:     "",
                    autocheck:  false,
                    autoupdate: false
                }
            } else {
                global.__settings = data;
            }

            fs_extra.readJson(path.join(__home, '/addons.json'), function (err, data) {
                if (!data) {
                    // CORE DOWNLOAD CALL
                } else {
                    global.__addons = data;

                    fs_extra.readJson(path.join(__home, '/core.json'), function (err, data) {
                        if (!data) {
                            // CORE DOWNLOAD CALL
                        } else {
                            global.__core = data;
                            fs_extra.readJson(path.join(__home, '/profiles.json'), function (err, data) {
                                if (!data) {
                                    // CORE DOWNLOAD CALL
                                } else {
                                    global.__profiles = data;
                                    createWindow();
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    app.on('ready', function () {
        createInstance();
        //autoUpdater.initialize();
    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', function () {
        if (__window === null) {
            createInstance();
        }
    });

}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance () {
    return app.makeSingleInstance(function () {
        if (__window) {
            if (__window.isMinimized()) __window.restore();
            __window.focus();
        }
    })
}

// Handle Squirrel on Windows startup events
switch (process.argv[1]) {
    case '--squirrel-install':
        autoUpdater.createShortcut(function () {
            app.quit()
        });
        break;
    case '--squirrel-uninstall':
        autoUpdater.removeShortcut(function () {
            app.quit()
        });
        break;
    case '--squirrel-obsolete':
    case '--squirrel-updated':
        app.quit();
        break;
    default:
        initialize()
}