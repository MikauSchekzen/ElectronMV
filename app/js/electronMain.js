const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

const root = path.join(__dirname, '../');
process.env.PRODUCTION = process.env.npm_package_name === undefined;
const devMode = (process.argv || []).indexOf('--dev') !== -1;
process.env.DEV = devMode;

app.commandLine.appendSwitch('js-flags', '--expose_gc');

let win;

const defaultWinDataPath = path.join(root, './data/WinData.json');
let winDataPath = '';
if (path.extname(root) === '.asar') {
  winDataPath = path.join(root, '../save/winData.rpgsave');
} else {
  winDataPath = path.join(root, './save/winData.rpgsave');
}
let defaultWinData = JSON.parse(fs.readFileSync(defaultWinDataPath, 'utf8'));
let winData = Object.assign({}, defaultWinData);

function start () {
  fs.readFile(winDataPath, 'utf8', (err, data) => {
    if (!err) {
      data = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
      winData = Object.assign({}, defaultWinData, {
        width: data.width,
        height: data.height,
        x: data.x,
        y: data.y,
        fullscreen: data.fullscreen,
        maximized: data.maximized
      });
    }
    if (!winData.width || !winData.height) {
      winData.width = defaultWinData.res[0];
      winData.height = defaultWinData.res[1];
    }
    createWindow();
  })
}

function createWindow () {
  win = new BrowserWindow({
    show: false,
    width: winData.width,
    height: winData.height,
    resizable: winData.resizable,
    useContentSize: true,
    webPreferences: {
      devTools: devMode && process.env.PRODUCTION !== 'true'
    },
    icon: "icon/icon.png"
  });

  win.loadURL(url.format({
    pathname: path.join(root, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  win.setMenu(null);
  win.setContentSize(winData.width, winData.height);

  let screen = require("electron").screen;
  let area = screen.getPrimaryDisplay().workArea;
  let winSize = win.getSize();
  win.setPosition(Math.floor(area.x + area.width / 2 - winSize[0] / 2), Math.floor(area.y + area.height / 2 - winSize[1] / 2));
  // if (!isNaN(winData.x) && !isNaN(winData.y)) {
    // win.setPosition(winData.x, winData.y);
  // }
  win.once('ready-to-show', () => {
    win.show();
  });
  win.on('closed', () => {
    const data = Buffer.from(JSON.stringify(winData), 'utf8').toString('base64');
    if (!fs.existsSync(path.dirname(winDataPath))) {
      fs.mkdirSync(path.dirname(winDataPath));
    }
    fs.writeFileSync(winDataPath, data);
    win = null;
  });
  win.on('move', () => {
    if(win.isMaximized()) return;
    winData.x = win.getPosition()[0];
    winData.y = win.getPosition()[1];
  });
  win.on('resize', () => {
    if(win.isMaximized()) return;
    winData.width  = win.getContentSize()[0];
    winData.height = win.getContentSize()[1];
  });
  win.on("maximize", () => {
    winData.maximized = true;
  });
  win.on("unmaximize", () => {
    winData.maximized = false;
  });
  win.on("enter-full-screen", () => {
    winData.fullscreen = true;
  });
  win.on("enter-html-full-screen", () => {
    winData.fullscreen = true;
  });
  win.on("leave-full-screen", () => {
    winData.fullscreen = false;
  });
  win.on("leave-html-full-screen", () => {
    winData.fullscreen = false;
  });
  win.webContents.openDevTools({
    mode: 'detach'
  });
  win.webContents.once('devtools-opened', () => {
    win.focus();
  });
  win.setFullScreen(winData.fullscreen || false);
  if(winData.maximized) win.maximize();
}

app.on('ready', start);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    start();
  }
});

ipcMain.on('get-WinData', (e) => {
  e.returnValue = Object.assign({}, winData, { fullscreen: win.isFullScreen(), maximized: win.isMaximized() });
});

ipcMain.on('open-DevTools', () => {
  win.webContents.openDevTools({
    detach: true
  });
});

ipcMain.on('set-fullscreen', (e) => {
  win.setFullScreen(!win.isFullScreen());
});
