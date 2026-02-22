module.exports = {
    install,
    uninstall
}

function install () {
    if (process.platform === 'darwin') {
        installDarwin()
    }
    if (process.platform === 'win32') {
        installWin32()
    }
    if (process.platform === 'linux') {
        installLinux()
    }
}

function uninstall () {
    if (process.platform === 'darwin') {
        uninstallDarwin()
    }
    if (process.platform === 'win32') {
        uninstallWin32()
    }
    if (process.platform === 'linux') {
        uninstallLinux()
    }
}

function installDarwin () {
}

function uninstallDarwin () {
}

/*var EXEC_COMMAND = [process.execPath]

if (!config.IS_PRODUCTION) {
    EXEC_COMMAND.push(config.ROOT_PATH)
}*/

function installWin32 () {
}

function uninstallWin32 () {
}

function commandToArgs (command) {
    return command.map((arg) => `"${arg}"`).join(' ')
}

function installLinux () {
}

function uninstallLinux () {
}
