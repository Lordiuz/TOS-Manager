var fs = require('fs'),
    path = require('path'),
    packagej = require('./package.json'),
    date = new Date,
    icon = (() => {
        var icon = path.join(__dirname, 'static', 'TOSanger');
        return process.platform === 'win32'
            ? icon + '.ico'
            : icon + '.png'
    })(),
    production = (() => {
        if (!process.versions.electron) {
            return false
        }
        if (process.platform === 'darwin') {
            return !/\/Electron\.app\//.test(process.execPath)
        }
        if (process.platform === 'win32') {
            return !/\\electron\.exe$/.test(process.execPath)
        }
        if (process.platform === 'linux') {
            return !/\/electron$/.test(process.execPath)
        }
    })(),
    baseUrl = 'https://nodejs.app';

console.log(production);

module.exports = {
    ANNOUNCEMENT_URL: baseUrl + '/desktop/announcement',

    APP_COPYRIGHT:    'Copyright © 2015-' + date.getFullYear() + ' ' + packagej.author,

    APP_ICON:         icon,
    APP_NAME:         packagej.name,
    APP_TEAM:         packagej.author,
    APP_VERSION:      packagej.version,
    APP_WINDOW_TITLE: packagej.name + ' β',

    AUTO_UPDATE_URL: baseUrl + '/desktop/update',

    CRASH_REPORT_URL: baseUrl + '/desktop/crash-report',

    CONFIG_PATH: path.dirname(process.execPath),

    DELAYED_INIT: 1500,

    HOME_PAGE_URL: baseUrl,

    GITHUB_URL:        'https://github.com/feross/webtorrent-desktop',
    GITHUB_URL_ISSUES: 'https://github.com/feross/webtorrent-desktop/issues',

    GITHUB_URL_RAW:    'https://raw.githubusercontent.com/feross/webtorrent-desktop/master',

    IS_PRODUCTION: production,

    ROOT_PATH:   __dirname,
    STATIC_PATH: path.join(__dirname, 'static'),

    WINDOW_MAIN:         'file://' + path.join(__dirname, 'render', 'index.html'),
    WINDOW_NOTIFICATION: 'file://' + path.join(__dirname, 'render', 'notification.html'),

    WINDOW_MIN_HEIGHT: 400,
    WINDOW_MIN_WIDTH:  500,
    WINDOW_MAX_HEIGHT: 700,
    WINDOW_MAX_WIDTH:  900
};

console.log(module.exports.CRASH_REPORT_URL);
console.log(module.exports.CONFIG_PATH);