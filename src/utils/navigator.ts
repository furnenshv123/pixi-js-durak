import { Application, } from 'pixi.js';
import { Scene } from '../impl/scene-impl';



export class Navigator {
  private static _app: Application;
  private static currentScene: Scene | null = null;

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

  static get width()  { return this._app.screen.width; }
  static get height() { return this._app.screen.height; }
}