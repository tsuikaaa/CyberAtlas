// Initialisation de la carte
var root = am5.Root.new("chartdiv");
root._logo.dispose();

// Thème futuriste
var myTheme = am5.Theme.new(root);
myTheme.rule("Label").setAll({ fontSize: "0.8em", fill: am5.color(0x00FFFF) });
root.setThemes([am5themes_Animated.new(root), myTheme]);

var chart = root.container.children.push(
  am5map.MapChart.new(root, {
    projection: am5map.geoMercator(),
    panX: 0,
    panY: 0,
    wheelable: false,
    draggable: false
  })
);

// Graticule futuriste
var graticuleSeries = chart.series.unshift(
  am5map.GraticuleSeries.new(root, { step: 10 })
);
graticuleSeries.mapLines.template.setAll({
  stroke: am5.color(0x00FFFF),
  strokeOpacity: 0.1,
  strokeDasharray: [2, 4]
});

// Polygones futuristes
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

// Bouton Globe / Carte
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
  chart.set("projection", isGlobe ? am5map.geoOrthographic() : am5map.geoMercator());

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
    setTimeout(() => { chart.goHome(); }, 100);
  } else {
    chart.setAll({
      projection: am5map.geoMercator(),
      panX: 0,
      panY: 0,
      marginTop: 0,
      marginBottom: 0,
      scale: 1
    });
    setTimeout(() => { chart.goHome(); }, 100);
  }
  toggleButton.textContent = isGlobe ? "Carte" : "Globe";
  chart.setAll({
    rotationX: 0,
    rotationY: 0,
    center: [0, 0]
  });
});


// === Rotation automatique + manuelle fluide ===
let isDragging = false;
let previousMouse = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };
const sensitivity = 0.3;
const friction = 0.95;

root.dom.addEventListener("pointerdown", (ev) => {
  if (!isGlobe) return;
  isDragging = true;
  previousMouse = { x: ev.clientX, y: ev.clientY };
});

root.dom.addEventListener("pointerup", () => {
  isDragging = false;
});

root.dom.addEventListener("pointermove", (ev) => {
  if (!isGlobe || !isDragging) return;

  let dx = ev.clientX - previousMouse.x;
  let dy = ev.clientY - previousMouse.y;

  velocity.x = dx * sensitivity;  
  velocity.y = -dy * sensitivity;

  previousMouse = { x: ev.clientX, y: ev.clientY };
});

root.events.on("frameended", () => {
  if (!isGlobe) return;

  velocity.x *= friction;
  velocity.y *= friction;

  rotation.x += velocity.x;
  rotation.y += velocity.y;

  if (!isDragging && Math.abs(velocity.x) < 0.01 && Math.abs(velocity.y) < 0.01) {
    rotation.x += 0.2; 
  }

  if (rotation.x > 90) rotation.x = 90;
  if (rotation.x < -90) rotation.x = -90;

  chart.set("rotationX", rotation.x);
  chart.set("rotationY", rotation.y);
});

// === Chargement des données ===
fetch("data/data.json")
  .then(response => response.json())
  .then(jsonData => {
    const zones = jsonData[0].zones;
    const data = jsonData.slice(1);

    const malwareSelect = document.getElementById("malwareSelect");
    const yearButtons = document.querySelectorAll(".year-btn");

    let currentYear = null;
    let currentMalware = null;

    function updateMalwareOptions(year) {
      const availableMalwares = [
        ...new Set(
          data.filter(d => d["Année"] == year).map(d => d["Type de malware"])
        )
      ].sort();

      malwareSelect.innerHTML = '<option value="all">Global</option>';
      availableMalwares.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        malwareSelect.appendChild(opt);
      });

      currentMalware = "all";
      malwareSelect.value = "all";
    }

    function updateMap() {
      if (!currentYear) return;

      const filtered = data.filter(d => d["Année"] == currentYear);
      const subset =
        currentMalware === "all"
          ? filtered
          : filtered.filter(d => d["Type de malware"] === currentMalware);

      const hasRegionalZones = subset.some(d =>
        ["EMEA", "APAC", "Americas"].includes(d["Zone géographique"])
      );

      const mapData = [];
      const highlightedZones = new Set();

      subset.forEach(item => {
        const zone = item["Zone géographique"];
        if (hasRegionalZones && zone === "Global") return;

        const value = parseFloat(item["Pourcentage"]);
        if (zones[zone]) {
          zones[zone].forEach(countryCode => {
            mapData.push({ id: countryCode, value });
            highlightedZones.add(countryCode);
          });
        }
      });

      polygonSeries.data.setAll(mapData);

      // Coloration dynamique fluide
      polygonSeries.mapPolygons.each(polygon => {
        const pid = polygon.dataItem?.dataContext?.id || polygon.get("id") || null;
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

// --- Affichage des phrases selon le filtre ---
const statsContainer = document.getElementById("malwareStats");
statsContainer.innerHTML = "";

// Si le filtre sélectionné n'est pas "Global"
if (currentMalware !== "all") {
  subset.forEach(item => {
    if (item["Zone géographique"] !== "Global" && item["Zone géographique"] !== "Other") {
      const malware = item["Type de malware"];
      const pct = item["Pourcentage"];
      const year = item["Année"];
      const zone = item["Zone géographique"];
      statsContainer.innerHTML += `<p>${malware} responsable de ${pct}% des attaques en ${year} dans la zone ${zone}.</p>`;
    }
  });
}

}

    // === Événements ===
    yearButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        yearButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentYear = btn.getAttribute("data-year");
        updateMalwareOptions(currentYear);
        updateMap();
      });
    });

    malwareSelect.addEventListener("change", e => {
      currentMalware = e.target.value;
      updateMap();
    });

    // Initialisation
    yearButtons[0].classList.add("active");
    currentYear = yearButtons[0].getAttribute("data-year");
    updateMalwareOptions(currentYear);
    updateMap();
  })
  .catch(err => console.error("Erreur lors du chargement du JSON :", err));
