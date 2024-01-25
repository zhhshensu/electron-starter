import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  app as electronApp,
  App as ElectronApp,
  BrowserWindow,
  WebPreferences,
} from "electron";
import * as path from "path";

@Injectable()
export class WinService implements OnModuleInit {
  public mainWindow: BrowserWindow;
  onModuleInit() {
    if (electronApp) {
      const isDuplicateInstance = electronApp.requestSingleInstanceLock();
      if (!isDuplicateInstance) {
        electronApp.quit();
      } else {
        electronApp.on("second-instance", () => {
          if (this.mainWindow) {
            if (this.mainWindow.isMinimized()) {
              this.mainWindow.restore();
            }
            this.mainWindow.focus();
          }
        });
      }
      electronApp.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
          electronApp.quit();
        }
      });
      electronApp.whenReady().then(() => {
        const userDataPath = electronApp.getPath("userData");
        console.log(
          "🚀 ~ file: win.service.ts:41 ~ WinService ~ electronApp.whenReady ~ userDataPath:",
          userDataPath
        );
        this.createMainWindow(electronApp);
      });
    }
  }

  async createMainWindow(electronApp: ElectronApp) {
    const WebPreferences = this.getWebPreferences({
      preload: path.join(__dirname, "preload.js"),
    });
    this.mainWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 650,
      minWidth: 800,
      minHeight: 500,
      hasShadow: true,
      resizable: true,
      useContentSize: true,
      webPreferences: WebPreferences,
    });
    this.mainWindow.once("ready-to-show", () => {
      // 添加日志
    });
    this.mainWindow.on("closed", () => {
      this.mainWindow.destroy();
      electronApp.quit();
    });
    this.loadPage();
  }

  async loadPage() {
    this.mainWindow.resizable = true;
    this.mainWindow.setBackgroundColor("#000000"); //背景颜色
    this.mainWindow.show();
    this.mainWindow.maximize();
    this.mainWindow.webContents.once("dom-ready", () => {});
  }

  getWebPreferences(otherParams = {}): WebPreferences {
    return {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      nodeIntegrationInSubFrames: true,
      devTools: true,
      plugins: true, //是否应该启用插
      sandbox: false,
      allowRunningInsecureContent: true, //允许一个 https 页面运行来自http url的JavaScript, CSS 或 plugins
      webSecurity: false, // 它将禁用同源策略
      //上下文隔离功能将确保您的 预加载脚本 和 Electron的内部逻辑 运行在所加载的 webcontent网页 之外的另一个独立的上下文环境里。 这对安全性很重要，因为它有助于阻止网站访问 Electron 的内部组件 和 您的预加载脚本可访问的高等级权限的API 。
      contextIsolation: true, //如果设置为false管理系统打不开,控制台提示jquery找不到
      ...otherParams,
    };
  }
}
