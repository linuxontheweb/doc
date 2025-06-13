const log=(...args)=>{console.log(...args);};
const cwarn=(...args)=>{console.warn(...args);};
const mks=which=>{return  document.createElementNS("http://www.w3.org/2000/svg",which);};
export class GUI {
  constructor(game, containerId) {/* « */
    this.game = game;
    this.container = document.getElementById(containerId);
    this.svg = mks("svg");
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    this.svg.setAttribute("viewBox", "0 0 1000 600"); // Wider viewBox for widescreen
    this.container.appendChild(this.svg);
    this.shape = 2; // Default to 2 bases
    this.resize();
this.button = mks("circle");
this.button.setAttribute("r", 8);
    window.addEventListener("resize", () => this.resize());
  }/* » */

  setShape(numBases) {/* « */
    if (this.game.isActive) return;
    if (numBases < 2 || numBases > 10) return;
    this.shape = numBases;
    this.updateSVG();
  }/* » */
  resize() {/* « */
    const { width, height } = this.container.getBoundingClientRect();
    const aspectRatio = 1000 / 600; // Match viewBox ratio
    let svgWidth = width;
    let svgHeight = width / aspectRatio;
    if (svgHeight > height) {
      svgHeight = height;
      svgWidth = height * aspectRatio;
    }
    this.svg.style.width = `${svgWidth}px`;
    this.svg.style.height = `${svgHeight}px`;
    this.svg.style.margin = "auto";
  }/* » */
setActivePlayer(which){/* « */

if (which >= this.labels.length){
cwarn(`Seat: ${which} is out of range`);
return;
}
if (this.activeLabel){
	this.activeLabel.style.fontWeight = "";
	this.activeLabel.setAttribute("fill", "");
	this.activeLabel.style.fontSize = "20px";
}
let label = this.labels[which];
this.activeLabel = label;
label.style.fontWeight = "bold";
label.style.fontSize = "30px";
label.setAttribute("fill", "#a00");

}/* » */
setButton(which){/* « */
if (this.game.isActive) return;
if (which >= this.points.length){
cwarn(`Seat: ${which} is out of range`);
return;
}
let point = this.points[which];
let cir = this.button;
cir.setAttribute("cx", point.x+"");
cir.setAttribute("cy", point.y+"");
this.svg.appendChild(cir);
}/* » */
updateSVG() {/* « */
	this.svg.innerHTML = "";
	const centerX = 500; // Adjusted for wider viewBox
	const centerY = 300;
	const radiusX = 500; // Horizontal radius (wider)
	const radiusY = 200; // Vertical radius (squashed)
	const points = [];
this.points = points;
	const numBases = this.shape;

	// Calculate vertices, starting with home plate at bottom (270 degrees)
	const angleStep = - 360 / numBases;
	for (let i = 0; i < numBases; i++) {
	  const angle = (270 + i * angleStep) % 360; // Start at 270° (bottom)
	  const rad = (angle * Math.PI) / 180;
	  const x = centerX + radiusX * Math.cos(rad);
	  const y = centerY - radiusY * Math.sin(rad); // Negative for SVG y-axis
	  points.push({ x, y });
	}

	// Draw polygon
	const polygon = mks("polygon");
	polygon.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" "));
	polygon.setAttribute("fill", "none");
	polygon.setAttribute("stroke", "black");
	polygon.setAttribute("stroke-width", "2");
	this.svg.appendChild(polygon);

	// Add labels (1 at home, clockwise)
	this.labels = [];
	points.forEach((p, i) => {
	  const text = mks("text");
	  text.setAttribute("x", p.x);
	  text.setAttribute("y", p.y - 10);
	  text.setAttribute("text-anchor", "middle");
	  text.textContent = i + 1;
text.style.fontSize = "20px";
this.labels.push(text);
	  this.svg.appendChild(text);
	});
}/* » */

}
