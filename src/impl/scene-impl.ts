import { Container } from "pixi.js";

export abstract class Scene extends Container {
  abstract onStart(): void;
  abstract onDestroy(): void;
}