import { Application, } from 'pixi.js';
import { Scene } from '../impl/scene-impl';



export class Navigator {
  private static _app: Application;
  private static currentScene: Scene | null = null;
  private static stack: Scene[] = [];                         
  private static listeners: Map<string, Function[]> = new Map(); 

  static init(app: Application) {
    this._app = app;
  }

  static get app(): Application { return this._app; }

  static async switchTo(scene: Scene) {
    if (this.currentScene) {
      this.currentScene.onDestroy();
      this._app.stage.removeChild(this.currentScene);
      this.currentScene.destroy({ children: true });
    }

    this.currentScene = scene;
    this._app.stage.addChild(scene);
    scene.onStart();
  }
  static push(scene: Scene) {
    this.stack.push(scene);
    this._app.stage.addChild(scene); 
    scene.onStart();
  }

  static pop() {
    const top = this.stack.pop();
    if (!top) return;

    top.onDestroy();
    this._app.stage.removeChild(top);
    top.destroy({ children: true });
  }

  static emit(event: string, data?: any) {
    const fns = this.listeners.get(event) ?? [];
    fns.forEach(fn => fn(data));
  }
  static on(event: string, fn: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(fn);
  }

  static once(event: string, fn: Function) {
    const wrapper = (data: any) => {
      fn(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  static off(event: string, fn: Function) {
    const fns = this.listeners.get(event) ?? [];
    this.listeners.set(event, fns.filter(f => f !== fn));
  }
  static get width()  { return this._app.screen.width; }
  static get height() { return this._app.screen.height; }
}