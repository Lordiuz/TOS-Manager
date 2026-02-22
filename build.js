//const builder = require("electron-builder")
/*
// Promise is returned 
builder.build({
    platform:    [builder.Platform.WINDOWS],
    devMetadata: {}
})
.then(() => {
    console.log('Ура, билд готов!');
})
.catch((error) => {
    console.log(error);
})*/

var cp = require('child_process')
var electronPackager = require('electron-packager')
var fs = require('fs')
var os = require('os')
var path = require('path')
var series = require('run-series')


var config = require('./app/config')
var pkg = require('./app/package.json')

var BUILD_NAME = config.APP_NAME + '-v' + config.APP_VERSION
var DIST_PATH = path.join(__dirname, '/dist/')


var all = {
    // The human-readable copyright line for the app. Maps to the `LegalCopyright` metadata
    // property on Windows, and `NSHumanReadableCopyright` on OS X.
    'app-copyright': config.APP_COPYRIGHT,

    // The release version of the application. Maps to the `ProductVersion` metadata
    // property on Windows, and `CFBundleShortVersionString` on OS X.
    'app-version': pkg.version,

    // Package the application's source code into an archive, using Electron's archive
    // format. Mitigates issues around long path names on Windows and slightly speeds up
    // require().
    asar: true,

    // A glob expression, that unpacks the files with matching names to the
    // "app.asar.unpacked" directory.
    'asar-unpack': 'TOSanger*',

    // The build version of the application. Maps to the FileVersion metadata property on
    // Windows, and CFBundleVersion on OS X. Note: Windows requires the build version to
    // start with a number. We're using the version of the underlying WebTorrent library.
    'build-version': pkg.version,

    // The application source directory.
    dir: config.ROOT_PATH,

    // Pattern which specifies which files to ignore when copying files to create the
    // package(s).
    ignore: /^\/dist|\/(appveyor.yml|\.appveyor.yml|\.github|appdmg|AUTHORS|CONTRIBUTORS|bench|benchmark|benchmark\.js|bin|bower\.json|component\.json|coverage|doc|docs|docs\.mli|dragdrop\.min\.js|example|examples|example\.html|example\.js|externs|ipaddr\.min\.js|Makefile|min|minimist|perf|rusha|simplepeer\.min\.js|simplewebsocket\.min\.js|static\/screenshot\.png|test|tests|test\.js|tests\.js|webtorrent\.min\.js|\.[^\/]*|.*\.md|.*\.markdown)$/,

    // The application name.
    name: config.APP_NAME,

    // The base directory where the finished package(s) are created.
    out: DIST_PATH,

    // Replace an already existing output directory.
    overwrite: true,

    // Runs `npm prune --production` which remove the packages specified in
    // "devDependencies" before starting to package the app.
    prune: true,

    // The Electron version with which the app is built (without the leading 'v')
    version: require('electron-prebuilt/package.json').version
}

var darwin = {
    // Build for OS X
    platform: 'darwin',

    // Build 64 bit binaries only.
    arch: 'x64',

    // The bundle identifier to use in the application's plist (OS X only).
    'app-bundle-id': 'io.webtorrent.webtorrent',

    // The application category type, as shown in the Finder via "View" -> "Arrange by
    // Application Category" when viewing the Applications directory (OS X only).
    'app-category-type': 'public.app-category.utilities',

    // The bundle identifier to use in the application helper's plist (OS X only).
    'helper-bundle-id': 'io.webtorrent.webtorrent-helper',

    // Application icon.
    icon: config.APP_ICON + '.icns'
}

var win32 = {
    // Build for Windows.
    platform: 'win32',

    // Build 32 bit binaries only.
    arch: 'ia32',

    // Object hash of application metadata to embed into the executable (Windows only)
    'version-string': {

        // Company that produced the file.
        CompanyName: config.APP_NAME,

        // Name of the program, displayed to users
        FileDescription: config.APP_NAME,

        // Original name of the file, not including a path. This information enables an
        // application to determine whether a file has been renamed by a user. The format of
        // the name depends on the file system for which the file was created.
        OriginalFilename: config.APP_NAME + '.exe',

        // Name of the product with which the file is distributed.
        ProductName: config.APP_NAME,

        // Internal name of the file, if one exists, for example, a module name if the file
        // is a dynamic-link library. If the file has no internal name, this string should be
        // the original filename, without extension. This string is required.
        InternalName: config.APP_NAME
    },

    // Application icon.
    icon: config.APP_ICON
}

var linux = {
    // Build for Linux.
    platform: 'linux',

    // Build 32 and 64 bit binaries.
    arch: 'all'

    // Note: Application icon for Linux is specified via the BrowserWindow `icon` option.
}

function buildWin32 (cb) {
    var installer = require('electron-winstaller')
    console.log('Windows: Packaging electron...')

    /*
     * Path to folder with the following files:
     *   - Windows Authenticode private key and cert (authenticode.p12)
     *   - Windows Authenticode password file (authenticode.txt)
     */
    var CERT_PATH
    try {
        fs.accessSync('D:')
        CERT_PATH = 'D:'
    } catch (err) {
        CERT_PATH = path.join(os.homedir(), 'Desktop')
    }

    electronPackager(Object.assign({}, all, win32), function (err, buildPath) {
        if (err) return cb(err)
        console.log('Windows: Packaged electron. ' + buildPath)

        var signWithParams
        /*if (process.platform === 'win32') {
            if (argv.sign) {*/
                var certificateFile = path.join(__dirname, '/authenticode.pfx')
                var certificatePassword = fs.readFileSync(path.join(__dirname, '/authenticode.txt'), 'utf8')
                var timestampServer = 'http://timestamp.comodoca.com'
                signWithParams = `/a /f "${certificateFile}" /p "${certificatePassword}" /tr "${timestampServer}" /td sha256`
            /*} else {
                printWarning()
            }
        } else {
            printWarning()
        }*/

        /*var tasks = []
        if (argv.package === 'exe' || argv.package === 'all') {
            tasks.push((cb) => packageInstaller(cb))
        }
        if (argv.package === 'portable' || argv.package === 'all') {
            tasks.push((cb) => packagePortable(cb))
        }
        series(tasks, cb)*/

        function packageInstaller (cb) {
            console.log('Windows: Creating installer...')

            installer.createWindowsInstaller({
                appDirectory:    buildPath[0],
                authors:         config.APP_TEAM,
                description:     config.APP_NAME,
                exe:             config.APP_NAME + '.exe',
                iconUrl:         'https://raw.githubusercontent.com/feross/webtorrent-desktop/master/static/WebTorrent.ico',
                loadingGif:      path.join(config.STATIC_PATH, 'loading.gif'),
                name:            config.APP_NAME,
                noMsi:           true,
                outputDirectory: DIST_PATH,
                productName:     config.APP_NAME,
                //remoteReleases:  config.GITHUB_URL,
                setupExe:        config.APP_NAME + 'Setup-v' + config.APP_VERSION + '.exe',
                setupIcon:       config.APP_ICON,
                //signWithParams:  signWithParams,
                title:           config.APP_NAME,
                usePackageJson:  false,
                version:         pkg.version
            })
            .then(function () {
                console.log('Windows: Created installer.')
                cb(null)
            })
            .catch(cb)
        }

        packageInstaller((err)=>{err && console.log(err)});

        /*function packagePortable (cb) {
            console.log('Windows: Creating portable app...')

            var portablePath = path.join(buildPath[0], 'Portable Settings')
            mkdirp.sync(portablePath)

            var inPath = path.join(DIST_PATH, path.basename(buildPath[0]))
            var outPath = path.join(DIST_PATH, BUILD_NAME + '-win.zip')
            zip.zipSync(inPath, outPath)

            console.log('Windows: Created portable app.')
            cb(null)
        }*/
    })
}

/*
 * Print a large warning when signing is disabled so we are less likely to accidentally
 * ship unsigned binaries to users.
 */
function printWarning () {
    console.log(fs.readFileSync(path.join(__dirname, 'warning.txt'), 'utf8'))
}


buildWin32();