import { Application, } from "pixi.js";
import { Navigator } from "./utils/navigator";
import { LoadingScene } from "./scenes/loading-scene";
import { MenuScene } from "./scenes/menu-scene";

(async () => {
  const app = new Application();

  await app.init({ background: "#1099bb", resizeTo: window });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  Navigator.init(app);
  await Navigator.switchTo(new LoadingScene(() => { Navigator.switchTo(new MenuScene()); }));
})();


