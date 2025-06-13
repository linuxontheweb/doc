const log=(...args)=>{console.log(...args);};
const cwarn=(...args)=>{console.warn(...args);};
const cerr=(...args)=>{console.error(...args);};

import { GUI } from "./gui.js";

class Game {
  constructor() {
    this.isActive = false;
  }
}

const game = new Game();
const gui = new GUI(game, "game-container");

document.addEventListener("keydown", (e) => {//«
//log(e);
if (e.ctrlKey) return;
let k = e.key;
  if (k === " ") {
    game.isActive = !game.isActive;
log(game);
  } 
  else if (/^[1-9]$/.test(k)) {
    const numBases = parseInt(k) + 1;
    gui.setShape(numBases);
  }
else if (k.match(/^[!@#$%^&*()]$/)){
//log("HI", k);
//log(e);
let n = parseInt(e.code.replace(/Digit/,""));
gui.setButton(n);
//log(n);
}
});/* » */

window.addEventListener("resize", () => gui.resize());
