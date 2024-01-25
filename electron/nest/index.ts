import { app, BrowserWindow, shell, ipcMain, crashReporter } from "electron";
import { release } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, "..");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

export async function bootstrapElectron() {
  // Disable GPU Acceleration for Windows 7
  if (release().startsWith("6.1")) app.disableHardwareAcceleration();

  // Set application name for Windows 10+ notifications
  if (process.platform === "win32") app.setAppUserModelId(app.getName());

  if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
  }

  // Remove electron security warnings
  // This warning only shows in development mode
  // Read more on https://www.electronjs.org/docs/latest/tutorial/security
  // process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

  let win: BrowserWindow | null = null;
  // Here, you can also use other preload
  const preload = join(__dirname, "../preload/index.js");
  const url = process.env.VITE_DEV_SERVER_URL;
  console.log("🚀 ~ bootstrapElectron ~ url:", url);
  const indexHtml = join(process.env.DIST, "index.html");
  console.log("🚀 ~ bootstrapElectron ~ indexHtml:", indexHtml);

  async function createWindow() {
    // 启动情况当前窗体
    if (win) {
      win = null;
      app.quit();
      return;
    }
    win = new BrowserWindow({
      title: "Main window",
      icon: join(process.env.VITE_PUBLIC, "favicon.ico"),
      webPreferences: {
        preload,
        // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
        // nodeIntegration: true,

        // Consider using contextBridge.exposeInMainWorld
        // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
        // contextIsolation: false,
      },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      // electron-vite-vue#298
      win.loadURL(url);
      // Open devTool if the app is not packaged
      win.webContents.openDevTools();
    } else {
      win.loadFile(indexHtml);
      win.webContents.openDevTools();
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on("did-finish-load", () => {
      win?.webContents.send(
        "main-process-message",
        new Date().toLocaleString()
      );
    });

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("https:")) shell.openExternal(url);
      return { action: "deny" };
    });
    // win.webContents.on('will-navigate', (event, url) => { }) #344
  }

  app.whenReady().then(createWindow);

  app.on("window-all-closed", () => {
    win = null;
    if (process.platform !== "darwin") {
      app.quit();
    }
    process.exit(0);
  });

  // 单例模式
  app.on("second-instance", () => {
    if (win) {
      // Focus on the main window if the user tried to open another
      if (win.isMinimized()) win.restore();
      win.focus();
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
    }
  });

  app.on("activate", () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
      allWindows[0].focus();
    } else {
      createWindow();
    }
  });

  // New window example arg: new windows url
  ipcMain.handle("open-win", (_, arg) => {
    const childWindow = new BrowserWindow({
      webPreferences: {
        preload,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      childWindow.loadURL(`${url}#${arg}`);
    } else {
      childWindow.loadFile(indexHtml, { hash: arg });
    }
  });
}