import LocationBar from './LocationBar';
import { NBodySystemUpdater } from './NBodySceneUpdater';
import { BodyScene, SceneOptionsState } from './scene';
import './style.css'
import { SimpleUI } from './ui';

const mainElement = document.querySelector<HTMLDivElement>('#scene-container')!;

(async () => {
  const locationBar = new LocationBar<SceneOptionsState>();
  const options = locationBar.getState();
  

  const nbodyScene = new BodyScene(mainElement, new NBodySystemUpdater(), options);
  new SimpleUI(nbodyScene, locationBar);
  nbodyScene.start();
})();
