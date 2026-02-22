var notification = module.exports = {
    init,
    win: null
}

var electron = require('electron')

var app = electron.app

var config = require('../../config')
var tray = require('../tray')
var log = require('../tray')

function init (message) {
    if (notification.win) {
        return notification.win.show()
    }
    var win = notification.win = new electron.BrowserWindow({
        titleBarStyle: 'hidden-inset', // Hide title bar (OS X)
        width:           300,
        height:          100,
        icon:            config.APP_ICON,
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
    })

    win.setMenu(null);
    //win.webContents.openDevTools();
    win.loadURL(config.WINDOW_NOTIFICATION)
    win.webContents.on('did-finish-load', function () {
        win.show();
        win.webContents.send('notificationText', message);
        setTimeout(function () {
            win && win.destroy();
        }, 10000);
    });
}