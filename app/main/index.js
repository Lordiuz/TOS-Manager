console.time('init')

var electron = require('electron')

var app = electron.app
var ipcMain = electron.ipcMain

var announcement = require('./announcement')
var config = require('../config')
var crashReporter = require('../crash-reporter')
var dialog = require('./dialog')
var dock = require('./dock')
var handlers = require('./handlers')
var ipc = require('./ipc')
var squirrelWin32 = require('./squirrel')
var tray = require('./tray')
var updater = require('./updater')
var windows = require('./windows')

var shouldQuit = false
var argv = sliceArgv(process.argv)

// Simple logging helper, supports both __log(...) and __log.error(...)
global.__log = function (...args) {
    console.log(...args)
}
global.__log.error = function (...args) {
    console.error(...args)
}

if (process.platform === 'win32') {
    shouldQuit = squirrelWin32.handleEvent(argv[0])
    argv = argv.filter((arg) => arg.indexOf('--squirrel') === -1)
}

if (!shouldQuit) {
    // Prevent multiple instances of app from running at same time. New instances signal
    // this instance and quit.
    var gotLock = app.requestSingleInstanceLock()
    if (!gotLock) {
        shouldQuit = true
        app.quit()
    } else {
        app.on('second-instance', function (event, commandLine) {
            onAppOpen(commandLine)
        })
    }
}

if (!shouldQuit) {
    init()
}

function init () {
    /*if (config.IS_PORTABLE) {
        app.setPath('userData', config.CONFIG_PATH)
    }*/

    var isReady = false // app ready, windows can be created
    app.ipcReady = false // main window has finished loading and IPC is ready
    app.isQuitting = false

    // Open handlers must be added as early as possible
    app.on('open-file', onOpen)
    app.on('open-url', onOpen)

    //ipc.init()

    app.once('will-finish-launching', function () {
        //crashReporter.init()
    })

    app.on('ready', function () {
        isReady = true

        windows.main.init()

        console.timeEnd('init')

        // To keep app startup fast, some code is delayed.
        setTimeout(delayedInit, config.DELAYED_INIT)
    })

    app.once('ipcReady', function () {
        __log('Command line args:', argv)
        processArgv(argv)
        console.timeEnd('init')
    })

    app.on('before-quit', function (e) {
        if (app.isQuitting) return

        app.isQuitting = true
        e.preventDefault()
        //ipcMain.once('savedState', () => app.quit())
        setTimeout(() => app.quit(), config.DELAYED_INIT) // quit after 2 secs, at most
    })

    app.on('activate', function () {
        if (isReady) windows.main.show()
    })
}

function delayedInit () {
    windows.main.show()
    //announcement.init()
    //dock.init()
    handlers.install()
    tray.init()
    updater.init()
}

function onOpen (e, torrentId) {
    e.preventDefault()

    if (app.ipcReady) {
        // Magnet links opened from Chrome won't focus the app without a setTimeout.
        // The confirmation dialog Chrome shows causes Chrome to steal back the focus.
        // Electron issue: https://github.com/atom/electron/issues/4338
        setTimeout(() => windows.main.show(), 100)
    } else {
        argv.push(torrentId)
    }
}

function onAppOpen (newArgv) {
    newArgv = sliceArgv(newArgv)

    if (app.ipcReady) {
        windows.main.show()
    } else {
        argv.push(...newArgv)
    }
}

function sliceArgv (argv) {
    return argv.slice(config.IS_PRODUCTION ? 1 : 2)
}

function processArgv (argv) {
}
