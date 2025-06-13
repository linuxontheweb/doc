export class GUI {
  constructor(game, containerId) {
    this.game = game;
    this.container = document.getElementById(containerId);
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    this.svg.setAttribute("viewBox", "0 0 800 600");
    this.container.appendChild(this.svg);
    this.shape = 2; // Default to 2 bases
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  setShape(numBases) {
    if (this.game.isActive) return;
    if (numBases < 2 || numBases > 10) return;
    this.shape = numBases;
    this.updateSVG();
  }

  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    const aspectRatio = 800 / 600;
    let svgWidth = width;
    let svgHeight = width / aspectRatio;
    if (svgHeight > height) {
      svgHeight = height;
      svgWidth = height * aspectRatio;
    }
    this.svg.style.width = `${svgWidth}px`;
    this.svg.style.height = `${svgHeight}px`;
    this.svg.style.margin = "auto";
  }

  updateSVG() {
    this.svg.innerHTML = "";
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    const points = [];
    const numBases = this.shape;

    // Home plate at bottom center (90 degrees)
    points.push({ x: centerX, y: centerY + radius });

    // Calculate other vertices
    const angleOffset = 90; // Start at top (2nd base) and go clockwise
    const angleStep = 360 / numBases;
    for (let i = 1; i < numBases; i++) {
      const angle = (angleOffset + i * angleStep) % 360;
      const rad = (angle * Math.PI) / 180;
      const x = centerX + radius * Math.cos(rad);
      const y = centerY - radius * Math.sin(rad); // Negative for SVG y-axis
      points.push({ x, y });
    }

    // Draw polygon
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" "));
    polygon.setAttribute("fill", "none");
    polygon.setAttribute("stroke", "black");
    polygon.setAttribute("stroke-width", "2");
    this.svg.appendChild(polygon);

    // Add labels
    points.forEach((p, i) => {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", p.x);
      text.setAttribute("y", p.y - 10);
      text.setAttribute("text-anchor", "middle");
      text.textContent = i + 1;
      this.svg.appendChild(text);
    });
  }
}
