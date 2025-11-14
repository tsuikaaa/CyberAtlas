/************************************************************
 *  SECTION 1 — INITIALISATION DE LA CARTE ET DU ROOT AMCHARTS
 ************************************************************/

var root = am5.Root.new("chartdiv");
root._logo.dispose();

// Thème futuriste
var myTheme = am5.Theme.new(root);
myTheme.rule("Label").setAll({
  fontSize: "0.8em",
  fill: am5.color(0x00FFFF)
});

root.setThemes([
  am5themes_Animated.new(root),
  myTheme
]);


/************************************************************
 *  SECTION 2 — CONFIGURATION DE LA CARTE (MERCATOR)
 ************************************************************/

var chart = root.container.children.push(
  am5map.MapChart.new(root, {
    projection: am5map.geoMercator(),
    panX: 0,
    panY: 0,
    wheelable: false,
    draggable: false
  })
);

// Graticule design futuriste
var graticuleSeries = chart.series.unshift(
  am5map.GraticuleSeries.new(root, {
    step: 10
  })
);

graticuleSeries.mapLines.template.setAll({
  stroke: am5.color(0x00FFFF),
  strokeOpacity: 0.1,
  strokeDasharray: [2, 4]
});

// Polygones de la carte
var polygonSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow,
    valueField: "value",
    calculateAggregates: true,
    exclude: ["AQ"]
  })
);

polygonSeries.mapPolygons.template.setAll({
  tooltipText: "{name}",
  stroke: am5.color(0x00FFFF),
  strokeWidth: 0.8,
  fill: am5.color(0x111133),
  interactive: false
});

polygonSeries.mapPolygons.template.states.create("hover", {
  fill: am5.color(0xff0055),
  stroke: am5.color(0xFFFFFF),
  strokeWidth: 1.2
});


/************************************************************
 *  SECTION 3 — BOUTON GLOBE / CARTE + RÉGLAGES RESPONSIVE
 ************************************************************/

const toggleButton = document.getElementById("toggleGlobe");
let isGlobe = false;

function updateGlobeScale() {
  const chartdiv = document.getElementById("chartdiv");
  let size = Math.min(window.innerWidth, window.innerHeight);
  chartdiv.style.width = size + "px";
  chartdiv.style.height = size + "px";
  chart.set("scale", 0.97);
}

window.addEventListener("resize", updateGlobeScale);
updateGlobeScale();

toggleButton.addEventListener("click", () => {
  isGlobe = !isGlobe;

  chart.set(
    "projection",
    isGlobe ? am5map.geoOrthographic() : am5map.geoMercator()
  );

  if (isGlobe) {
    chart.setAll({
      projection: am5map.geoOrthographic(),
      panX: "none",
      panY: "none",
      centerMapOnZoomOut: false,
      marginTop: 0,
      marginBottom: 0,
      scale: 0.97
    });

    setTimeout(() => chart.goHome(), 100);

  } else {
    chart.setAll({
      projection: am5map.geoMercator(),
      panX: 0,
      panY: 0,
      marginTop: 0,
      marginBottom: 0,
      scale: 1
    });

    setTimeout(() => chart.goHome(), 100);
  }

  toggleButton.textContent = isGlobe ? "Carte" : "Globe";

  // Reset de la rotation
  chart.setAll({
    rotationX: 0,
    rotationY: 0,
    center: [0, 0]
  });
});


/************************************************************
 *  SECTION 4 — ROTATION AUTOMATIQUE + DRAG MANUEL
 ************************************************************/

let isDragging = false;
let previousMouse = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };
const sensitivity = 0.3;
const friction = 0.95;

// Début du drag
root.dom.addEventListener("pointerdown", (ev) => {
  if (!isGlobe) return;
  isDragging = true;
  previousMouse = { x: ev.clientX, y: ev.clientY };
});

// Fin du drag
root.dom.addEventListener("pointerup", () => {
  isDragging = false;
});

// Mouvement de drag
root.dom.addEventListener("pointermove", (ev) => {
  if (!isGlobe || !isDragging) return;

  let dx = ev.clientX - previousMouse.x;
  let dy = ev.clientY - previousMouse.y;

  velocity.x = dx * sensitivity;
  velocity.y = -dy * sensitivity;

  previousMouse = { x: ev.clientX, y: ev.clientY };
});

// Animation continue
root.events.on("frameended", () => {
  if (!isGlobe) return;

  // Friction
  velocity.x *= friction;
  velocity.y *= friction;

  rotation.x += velocity.x;
  rotation.y += velocity.y;

  // Auto-rotation lente
  if (!isDragging && Math.abs(velocity.x) < 0.01 && Math.abs(velocity.y) < 0.01) {
    rotation.x += 0.2;
  }

  // Limites
  if (rotation.x > 90) rotation.x = 90;
  if (rotation.x < -90) rotation.x = -90;

  chart.set("rotationX", rotation.x);
  chart.set("rotationY", rotation.y);
});


/************************************************************
 *  SECTION 5 — CHARGEMENT DU JSON + FILTRAGE DES DONNÉES
 ************************************************************/

fetch("data/data.json")
  .then(response => response.json())
  .then(jsonData => {

    const zones = jsonData[0].zones;
    const data = jsonData.slice(1);

    const yearButtons = document.querySelectorAll(".year-btn");
    const zoneSelect = document.getElementById("zoneSelect");

    let currentYear = yearButtons[0].getAttribute("data-year");
    let currentZone = zoneSelect.value;


    /********************************************************
     *  SECTION 6 — ÉVÉNEMENTS DES BOUTONS + SELECT
     ********************************************************/

    yearButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        yearButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentYear = btn.getAttribute("data-year");
        updateMap();
      });
    });

    zoneSelect.addEventListener("change", () => {
      currentZone = zoneSelect.value;
      updateMap();
    });


    /********************************************************
     *  SECTION 7 — MISE À JOUR DE LA CARTE + STATISTIQUES
     ********************************************************/

    function updateMap() {
      const filtered = data.filter(d => d["Année"] == currentYear);
      const mapData = [];
      const highlightedZones = new Set();

      filtered.forEach(item => {
        const zone = item["Zone géographique"];
        const value = parseFloat(item["Pourcentage"]);

        if (zones[zone]) {
          zones[zone].forEach(countryCode => {
            mapData.push({ id: countryCode, value });
            highlightedZones.add(countryCode);
          });
        }
      });

      polygonSeries.data.setAll(mapData);

      // Animation des couleurs
      polygonSeries.mapPolygons.each(polygon => {
        const pid = polygon.dataItem?.dataContext?.id;
        const targetColor = highlightedZones.has(pid)
          ? am5.color(0xff66cc)
          : am5.color(0x111133);

        polygon.animate({
          key: "fill",
          to: targetColor,
          duration: 600,
          easing: am5.ease.out(am5.ease.cubic)
        });
      });


      /******************************************************
       *  SECTION 8 — AFFICHAGE DES PHRASES STATISTIQUES
       ******************************************************/

      const statsContainer = document.getElementById("malwareStats");
      statsContainer.innerHTML = "";

      filtered.forEach(item => {
        if (currentZone === "Global" || item["Zone géographique"] === currentZone) {
          let malware = item["Type de malware"];
          const pct = item["Pourcentage"];
          const year = item["Année"];
          const zone = item["Zone géographique"];

          if (malware === "Autre") malware = "Un autre type de malware";

          statsContainer.innerHTML +=
            `<p>${malware} est responsable de ${pct}% des attaques en ${year} dans la zone ${zone}.</p>`;
        }
      });

    }

    // Initialisation
    yearButtons[0].classList.add("active");
    updateMap();

  })
  .catch(err => console.error("Erreur lors du chargement du JSON :", err));


/************************************************************
 *  SECTION 9 — FALLBACK POUR L’IMAGE ABOUT (SVG)
 ************************************************************/

const img = document.getElementById('aboutImg');

if (img) {
  img.addEventListener('error', () => {

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
        <defs>
          <radialGradient id="g" cx="50%" cy="50%">
            <stop offset="0" stop-color="#0ff"/>
            <stop offset="1" stop-color="#070b17" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="#0a0f1e"/>
        <circle cx="300" cy="300" r="250" fill="url(#g)"/>

        <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
              font-family="system-ui,Arial,sans-serif" font-size="26" fill="#cfe6ff">
          Image non trouvée
        </text>
      </svg>
    `;

    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  });
}
