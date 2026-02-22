https = require('https');
https.get('https://webtorrent.io/desktop/update?version=0.7.1&platform=win32', (res) => {
	var data = "";
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', function () {
        console.log(data);
    });
})