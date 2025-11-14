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


/************************************************************
 *  TOP 5 MALWARES - SECTION 10
 ************************************************************/
// amCharts 5 - Top 5 pays avec drapeaux ronds (triés, sans pourcentages)
am5.ready(function () {
  const root = am5.Root.new("chartdiv-top5");
  root._logo.dispose();


  // Données (Top 5 du graphique partagé)
  let data = [
    { name: "Russie",      steps: 58.39, pictureSettings: { src: "https://flagcdn.com/w80/ru.png" } },
    { name: "Ukraine",     steps: 36.44, pictureSettings: { src: "https://flagcdn.com/w80/ua.png" } },
    { name: "Chine",       steps: 27.86, pictureSettings: { src: "https://flagcdn.com/w80/cn.png" } },
    { name: "États-Unis",  steps: 25.01, pictureSettings: { src: "https://flagcdn.com/w80/us.png" } },
    { name: "Nigéria",     steps: 21.28, pictureSettings: { src: "https://flagcdn.com/w80/ng.png" } }
  ];

  // Tri du plus grand au plus petit
  data.sort((a, b) => b.steps - a.steps);

  const chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      paddingLeft: 0,
      paddingRight: 30,
      wheelX: "none",
      wheelY: "none"
    })
  );


  // Axe Y (catégories) – inversé pour que le plus grand soit en haut
  const yRenderer = am5xy.AxisRendererY.new(root, {
    minorGridEnabled: true,
    inversed: true
  });
  yRenderer.grid.template.set("visible", false);

  const yAxis = chart.yAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: "name",
      renderer: yRenderer,
      paddingRight: 40
    })
  );

  // Axe X (valeurs)
  const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 80, minorGridEnabled: true });
  const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: xRenderer }));

  // Série
  const series = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: "WCIoverall",
      xAxis: xAxis,
      yAxis: yAxis,
      valueXField: "steps",
      categoryYField: "name",
      sequencedInterpolation: true,
      calculateAggregates: true,
      maskBullets: false,
      tooltip: am5.Tooltip.new(root, {
        dy: -30,
        pointerOrientation: "vertical",
        labelText: "{categoryY}: {valueX.formatNumber('0.00')}"
      })
    })
  );

  // Style des colonnes + dégradé bleu-violet
  series.columns.template.setAll({
    strokeOpacity: 0,
    cornerRadiusBR: 10,
    cornerRadiusTR: 10,
    cornerRadiusBL: 10,
    cornerRadiusTL: 10,
    maxHeight: 50,
    fillOpacity: 0.95,
    fillGradient: am5.LinearGradient.new(root, {
      rotation: 0,
      stops: [
        { color: am5.color(0x00e5ff) }, // bleu clair
        { color: am5.color(0x9b5de5) }  // violet néon
      ]
    })
  });

  let currentlyHovered;

  series.columns.template.events.on("pointerover", function (e) {
    handleHover(e.target.dataItem);
  });
  series.columns.template.events.on("pointerout", function () {
    handleOut();
  });

  function handleHover(dataItem) {
    if (dataItem && currentlyHovered != dataItem) {
      handleOut();
      currentlyHovered = dataItem;
      const bullet = dataItem.bullets[0];
      bullet.animate({
        key: "locationX",
        to: 1,
        duration: 600,
        easing: am5.ease.out(am5.ease.cubic)
      });
    }
  }
  function handleOut() {
    if (currentlyHovered) {
      const bullet = currentlyHovered.bullets[0];
      bullet.animate({
        key: "locationX",
        to: 0,
        duration: 600,
        easing: am5.ease.out(am5.ease.cubic)
      });
    }
  }

  // Bullet drapeau rond
  const circleTemplate = am5.Template.new({});
  series.bullets.push(function (root, series, dataItem) {
    const bulletContainer = am5.Container.new(root, {});
    const circle = bulletContainer.children.push(
      am5.Circle.new(root, { radius: 34 }, circleTemplate)
    );
    const maskCircle = bulletContainer.children.push(am5.Circle.new(root, { radius: 27 }));
    const imageContainer = bulletContainer.children.push(
      am5.Container.new(root, { mask: maskCircle })
    );
    imageContainer.children.push(
      am5.Picture.new(root, {
        templateField: "pictureSettings",
        centerX: am5.p50,
        centerY: am5.p50,
        width: 60,
        height: 60
      })
    );
    return am5.Bullet.new(root, { locationX: 0, sprite: bulletContainer });
  });

  // Données
  series.data.setAll(data);
  yAxis.data.setAll(data);

  const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
  cursor.lineX.set("visible", false);
  cursor.lineY.set("visible", false);
  cursor.events.on("cursormoved", function () {
    const dataItem = series.get("tooltip").dataItem;
    if (dataItem) handleHover(dataItem); else handleOut();
  });

  series.appear();
  chart.appear(1000, 100);
});


/************************************************************
Evolution des malwares - SECTION 11
 ************************************************************/
const data = {
  "Année": [2017,2018,2019,2020,2021,2022,2023,2024],
  "Phishing": [25344,26379,114702,241342,323972,300497,298878,193407],
  "Personal Data Breach": [30904,50642,38218,45330,51829,58859,55851,64882],
  "Non-Payment/Non-Delivery": [84079,65116,61832,108869,82478,51679,50523,49572],
  "Extortion": [14938,51146,43101,76741,39360,39416,48223,86415],
  "Identity Theft / Vol d'identité": [17636,16128,16053,43330,51629,27922,19778,21403]
};
const palette = {
  "Phishing": "#0072B2",
  "Personal Data Breach": "#E69F00",
  "Non-Payment/Non-Delivery": "#009E73",
  "Extortion": "#D55E00",
  "Identity Theft / Vol d'identité": "#CC79A7"
};

const years = data["Année"];
const cats = Object.keys(data).filter(k => k !== "Année");

const W=920,H=440,PAD_L=60,PAD_R=24,PAD_T=24,PAD_B=44;
const innerW=W-PAD_L-PAD_R,innerH=H-PAD_T-PAD_B;

const svg=document.getElementById('chart'),
axesG=document.getElementById('axes'),
gridG=document.getElementById('grid'),
linePath=document.getElementById('line'),
pointsG=document.getElementById('points'),
stats=document.getElementById('stats');

const tabButtons=Array.from(document.querySelectorAll('.tab'));

function format(n){return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
function scale(d0,d1,r0,r1){const m=(r1-r0)/(d1-d0);return x=>r0+(x-d0)*m;}

// repositionne dynamiquement le titre Y
function placeYAxisTitle() {
  const yTitle = document.getElementById('yTitle');
  let maxW = 0;
  axesG.querySelectorAll('text.ytick').forEach(t => {
    const w = t.getBBox().width;
    if (w > maxW) maxW = w;
  });
  yTitle.setAttribute('x', PAD_L + maxW + 14);
  yTitle.setAttribute('y', PAD_T + 2);
  yTitle.setAttribute('text-anchor', 'start');
}

function drawGridAndAxes(yMax){
  axesG.innerHTML=''; gridG.innerHTML='';
  const sx=scale(years[0],years[years.length-1],PAD_L,PAD_L+innerW);
  const sy=scale(0,yMax,PAD_T+innerH,PAD_T);
  const steps=6;

  for(let i=0;i<=steps;i++){
    const v=yMax*i/steps, y=sy(v);
    const grid=document.createElementNS('http://www.w3.org/2000/svg','line');
    grid.setAttribute('x1',PAD_L); grid.setAttribute('x2',PAD_L+innerW);
    grid.setAttribute('y1',y); grid.setAttribute('y2',y);
    grid.setAttribute('stroke','#232a4d'); gridG.appendChild(grid);

    const label=document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('x',PAD_L-8);
    label.setAttribute('y',y+4);
    label.setAttribute('text-anchor','end');
    label.setAttribute('class','axis ytick');
    label.textContent=format(Math.round(v));
    axesG.appendChild(label);
  }

  years.forEach(yr=>{
    const x=scale(years[0],years[years.length-1],PAD_L,PAD_L+innerW)(yr);
    const tick=document.createElementNS('http://www.w3.org/2000/svg','line');
    tick.setAttribute('x1',x); tick.setAttribute('x2',x);
    tick.setAttribute('y1',PAD_T+innerH); tick.setAttribute('y2',PAD_T+innerH+6);
    tick.setAttribute('stroke','#232a4d'); axesG.appendChild(tick);

    const text=document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x',x); text.setAttribute('y',PAD_T+innerH+22);
    text.setAttribute('text-anchor','middle');
    text.setAttribute('class','axis');
    text.textContent=yr; axesG.appendChild(text);
  });

  placeYAxisTitle();
}

function render(cat){
  const values=data[cat], color=palette[cat]||'#9AD1FF';
  const yMax=Math.max(...values)*1.18;
  const sx=scale(years[0],years[years.length-1],PAD_L,PAD_L+innerW);
  const sy=scale(0,yMax,PAD_T+innerH,PAD_T);
  drawGridAndAxes(yMax);

  let d='';
  values.forEach((v,i)=>{
    const x=sx(years[i]), y=sy(v);
    d += (i ? ` L ${x} ${y}` : `M ${x} ${y}`);
  });
  linePath.setAttribute('d',d);
  linePath.setAttribute('stroke',color);
  linePath.style.strokeDasharray='2000';
  linePath.style.strokeDashoffset='2000';
  linePath.getBoundingClientRect();
  linePath.style.transition='stroke-dashoffset 1200ms ease, stroke 200ms ease';
  linePath.style.strokeDashoffset='0';

  pointsG.innerHTML='';
  values.forEach((v,i)=>{
    const x=sx(years[i]), y=sy(v);
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');

    const hit=document.createElementNS('http://www.w3.org/2000/svg','circle');
    hit.setAttribute('cx',x); hit.setAttribute('cy',y);
    hit.setAttribute('r',12); hit.setAttribute('fill','transparent');

    const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',x); c.setAttribute('cy',y);
    c.setAttribute('r',4); c.setAttribute('fill',color);
    c.style.animation='pulse 1600ms ease-in-out infinite';

    const tip=document.createElementNS('http://www.w3.org/2000/svg','text');
    tip.setAttribute('x',x+8); tip.setAttribute('y',y-10);
    tip.setAttribute('fill','#FFFFFF'); tip.setAttribute('font-size','12');
    tip.setAttribute('opacity','0'); tip.setAttribute('class','tip');
    tip.textContent=years[i]+': '+format(v);

    const showTip=()=>{
      const rightEdge = PAD_L + innerW;
      const switchSide = x > (rightEdge - 120);
      tip.setAttribute('x', switchSide ? (x-8) : (x+8));
      tip.setAttribute('text-anchor', switchSide ? 'end' : 'start');
      tip.setAttribute('opacity','1');
    };
    const hideTip=()=>tip.setAttribute('opacity','0');

    g.appendChild(hit); g.appendChild(c); g.appendChild(tip);
    g.addEventListener('mouseenter',showTip);
    g.addEventListener('mouseleave',hideTip);
    pointsG.appendChild(g);
  });

  const total = values.reduce((a,b)=>a+b,0);
  const latest = values[values.length-1];
  const peak = Math.max(...values);
  const peakYear = years[values.indexOf(peak)];

  stats.innerHTML = `
    <h3 style="margin:6px 0 8px; color:${color}">${cat}</h3>
    <div class="metric"><span class="k">Total cumulé (2017–2024)</span><b>${format(total)}</b></div>
    <div class="metric"><span class="k">Dernière année (2024)</span><b>${format(latest)}</b></div>
    <div class="metric"><span class="k">Record annuel — ${peakYear}</span><b>${format(peak)}</b></div>
    <p class="sub" style="margin-top:8px; line-height:1.4">
      • <b>Total cumulé</b> : somme des incidents sur toute la période.<br>
      • <b>Dernière année</b> : incidents rapportés pour l’année la plus récente (2024).<br>
      • <b>Record annuel</b> : année avec le plus d’incidents entre 2017 et 2024.
    </p>`;
}

tabButtons.forEach(btn=>{
  btn.addEventListener('click',e=>{
    tabButtons.forEach(b=>b.setAttribute('aria-selected','false'));
    e.currentTarget.setAttribute('aria-selected','true');
    render(e.currentTarget.dataset.key);
  });
});

tabButtons[0].setAttribute('aria-selected','true');
render(cats[0]);