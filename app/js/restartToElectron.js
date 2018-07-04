try {
  // babel-register is only for development
  // files should be compiled for production
  require('babel-register')
} catch (e) { }
try {
  // require("electron");
  require('./js/electronRenderer.js');
} catch (e) {
  (function() {
    console.log('You are using an Electron Wrapper, but ran with nw.js ( default MV ) Will now restart with Electron...');
    var path = require('path');
    var root = path.dirname(process.mainModule.filename);
    root = path.join(root, '../');
    var os = require("os");
    var file;
    var spawn = require('child_process').spawn;
    var emv;
    if(os.platform() === "linux" || os.platform() === "darwin") {
      file = path.join(root, "play.sh");
      emv = spawn(file, {
        cwd: root,
        env: Object.assign({}, process.env, { DEV: true })
      });
    }
    else if(os.platform() === "win32") {
      file = path.join(root, 'nwjsToEMV.bat');
      emv = spawn('cmd.exe', ['/c', file], {
        cwd: root
      });
    }
    else {
      console.log("Restarting with Electron: OS not supported by script");
    }
    if(emv != null) {
      emv.on('exit', function(code, signal) {
        // Electron was opened, so close nw.js
        if (code === 1) {
          alert(`ERROR: ${file} was not found.`);
        }
        window.close();
      });
    }
  })();
}
