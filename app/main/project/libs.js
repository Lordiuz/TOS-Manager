'use strict';

module.exports = {
    checkReleases: function (addon, callback) {
        const https = require('https');
        var req = https.request({
            host: 'api.github.com',
            port: 443,
            path: '/repos/'+ addon.url +'/releases/latest?_=' + Date.now(),
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Lordiuz',
                'Cache-Control':'no-cache'
            }
        }, (res) => {
            var chunker = "";

            res.on('data', (chunk) => {
                chunker += chunk;
            });

            res.on('end', function () {
                const data = JSON.parse(chunker);
                callback(null, data);
            });
        });

        req.end();

        req.on('error', (e) => {
            callback({message: e});
        });
    },
    checkMaster: function (addon, callback) {
        const https = require('https');
        var req = https.request({
            host: 'api.github.com',
            port: 443,
            path: '/repos/'+ addon.url +'?_=' + Date.now(),
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Lordiuz',
                'Cache-Control':'no-cache'
            }
        }, (res) => {
            var chunker = "";

            res.on('data', (chunk) => {
                chunker += chunk;
            });

            res.on('end', function () {
                const data = JSON.parse(chunker);
                callback(null, data);
            });
        });

        req.end();

        req.on('error', (e) => {
            callback({message: e});
        });
    },
    downloadAddon: function (tmp, addon, callback) {
        var https = require('https');
        var fs = require('fs');

        var options = {
            host: 'api.github.com',
            path: addon.download,
            headers: {
                'Accept': 'application/octet-stream',
                'User-Agent': 'Lordiuz'
            }
        };

        var req = https.get(options, (res) => {
            var data = "";
            res.setEncoding('binary');
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', function () {
                var request = https.get(res.headers['location'], function (res) {
                    var data = "";
                    res.setEncoding('binary');
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', function () {
                        var path = require('path'),
                            file = path.join(tmp, addon.name + ".zip");
                        fs.appendFile(file, new Buffer(data, 'binary'), function () {
                            callback(file);
                        })
                    });
                });
            });
        });
    },
    unzipAddon: function (tmp, file, callback) {
        var yauzl = require("yauzl");
        var fs = require('fs-extra');
        var path = require("path");

        yauzl.open(file, {autoClose: false, lazyEntries: true}, function(err, zipfile) {
            if (err) throw err;
            zipfile.readEntry();
            zipfile.on("entry", function(entry) {
                if (/\/$/.test(entry.fileName)) {
                    // directory file names end with '/'
                    fs.mkdirs(tmp + '/' + entry.fileName, function(err) {
                        if (err) throw err;
                        zipfile.readEntry();
                    });
                } else {
                    // file entry
                    zipfile.openReadStream(entry, function(err, readStream) {
                        if (err) throw err;
                        // ensure parent directory exists
                        fs.mkdirs(path.dirname(tmp + '/' + entry.fileName), function(err) {
                            if (err) throw err;
                            readStream.pipe(fs.createWriteStream(tmp + '/' + entry.fileName));
                            readStream.on("end", function() {
                                zipfile.readEntry();
                            });
                        });
                    });
                }
            });
            zipfile.once("end", function() {
                zipfile.close();
                callback();
            });
        });
    }
};
