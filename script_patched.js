/**
 * ---------------------------------------
 * This demo was created using amCharts 5.
 * 
 * For more information visit:
 * https://www.amcharts.com/
 * 
 * Documentation is available at:
 * https://www.amcharts.com/docs/v5/
 * ---------------------------------------
 */

var bulletColor = am5.color(0xc83830);
var polygonColor = am5.color(0xd9cec8);

// ---------------------------------------------
// Chargement dynamique depuis data.json
// ---------------------------------------------
var data = [];

fetch('data.json')
  .then(response => response.json())
  .then(json => {
    // On choisit l'année à afficher (tu peux changer ici)
    const selectedYear = 2024;

    // On regroupe les données par zone géographique
    const zones = ["Global", "Americas", "EMEA (Europe, Middle East & Africa)", "APAC (Asia Pacific)"];

    // Pour chaque zone, on calcule la moyenne des pourcentages
    data = zones.map(zone => {
      const zoneData = json.filter(item => item["Année"] === selectedYear && item["Zone géographique"] === zone);

      // On calcule la moyenne du pourcentage
      const avg = zoneData.reduce((acc, cur) => acc + parseFloat(cur["Pourcentage"]), 0) / zoneData.length;

      // On attribue un code pays approximatif pour chaque zone (juste pour le visuel sur le globe)
      let id;
      switch (zone) {
        case "Global": id = "CN"; break; // Chine = symbole global
        case "Americas": id = "US"; break;
        case "EMEA (Europe, Middle East & Africa)": id = "FR"; break;
        case "APAC (Asia Pacific)": id = "JP"; break;
        default: id = "US";
      }

      return {
        id: id,
        threatened: avg,
        updated: avg // tu peux mettre une autre valeur si tu veux une autre mesure
      };
    });

    // Mise à jour du globe avec les données calculées
    polygonSeries.data.setAll(data);
  })
  .catch(err => console.error("Erreur lors du chargement du JSON :", err));



var root = am5.Root.new("chartdiv");

var myTheme = am5.Theme.new(root);

myTheme.rule("InterfaceColors").setAll({
  primaryButton: am5.color(0xc83830),
  primaryButtonHover: am5.Color.lighten(am5.color(0xc83830), 0.2),
  primaryButtonDown: am5.Color.lighten(am5.color(0xc83830), -0.2),
  primaryButtonActive: am5.color(0xd9cec8),
});


myTheme.rule("Label").setAll({
  fontSize: "0.8em"
});

root.setThemes([am5themes_Animated.new(root), myTheme]);

var chart = root.container.children.push(am5map.MapChart.new(root, {
  projection: am5map.geoMercator()
}));

var graticuleSeries = chart.series.unshift(
  am5map.GraticuleSeries.new(root, {
    step: 10
  })
);

graticuleSeries.mapLines.template.set("strokeOpacity", 0.05)


var cont = chart.children.push(am5.Container.new(root, {
  layout: root.horizontalLayout,
  x: am5.percent(15),
  centerX: 0,
  y: am5.percent(100),
  dy: -40
}));

// Add labels and controls
cont.children.push(am5.Label.new(root, {
  centerY: am5.p50,
  text: "Map"
}));

var switchButton = cont.children.push(am5.Button.new(root, {
  themeTags: ["switch"],
  centerY: am5.p50,
  icon: am5.Circle.new(root, {
    themeTags: ["icon"]
  })
}));

switchButton.on("active", function () {
  if (!switchButton.get("active")) {
    chart.set("projection", am5map.geoMercator());
    chart.set("panY", "translateY");
    chart.set("rotationY", 0);
    polygonSeries.set("exclude", ["AQ"]);
    
  } else {
    chart.set("projection", am5map.geoOrthographic());
    chart.set("panY", "rotateY")
    chart.set("panX", "rotateX");
    polygonSeries.set("exclude", []);
    chart.animate({ key: "rotationX", to: chart.get("rotationX") + 360, duration: 15000, easing: am5.ease.inOut(am5.ease.cubic) });
  }
});

cont.children.push(
  am5.Label.new(root, {
    centerY: am5.p50,
    text: "Globe"
  })
);


// proposed switch button


var cont2 = chart.children.push(am5.Container.new(root, {
  layout: root.horizontalLayout,
  x: am5.percent(85),
  centerX: am5.p100,
  y: am5.percent(100),
  dy: -40
}));

// Add labels and controls
cont2.children.push(am5.Label.new(root, {
  centerY: am5.p50,
  text: "Threatened"
}));

var switchButton2 = cont2.children.push(am5.Button.new(root, {
  themeTags: ["switch"],
  centerY: am5.p50,
  icon: am5.Circle.new(root, {
    themeTags: ["icon"]
  })
}));

switchButton2.on("active", function () {
  if (!switchButton2.get("active")) {
    polygonSeries.set("valueField", "threatened");
    polygonSeries.data.setAll(data);

  } else {
    polygonSeries.set("valueField", "updated");    
    polygonSeries.data.setAll(data);
  }
});

cont2.children.push(
  am5.Label.new(root, {
    centerY: am5.p50,
    text: "Updated"
  })
);

var polygonSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow,
    valueField: "threatened",
    calculateAggregates: true,
    exclude: ["AQ"]
  })
);

polygonSeries.mapPolygons.template.events.on("pointerover", function (ev) {
  heatLegend.showValue(ev.target.dataItem.get("value"));
});

polygonSeries.set("heatRules", [{
  target: polygonSeries.mapPolygons.template,
  dataField: "value",
  min: am5.color(0xd3a29f),
  max: am5.color(0x6f0600),
  key: "fill"
}]);

polygonSeries.mapPolygons.template.setAll({
  tooltipText: "{name} {value}%",
  fill: polygonColor,
  stroke: am5.color(0xffffff)
});

polygonSeries.data.setAll(data);


var heatLegend = chart.children.push(am5.HeatLegend.new(root, {
  orientation: "vertical",
  startColor: am5.color(0xd3a29f),
  endColor: am5.color(0x6f0600),
  startText: "Lowest",
  endText: "Highest",
  stepCount: 8,
  x: am5.p100,
  centerX: am5.p100,
  paddingRight: 20,
  paddingTop: 20,
  paddingBottom: 20
}));

heatLegend.startLabel.setAll({
  fontSize: 12,
  fill: heatLegend.get("startColor")
});

heatLegend.endLabel.setAll({
  fontSize: 12,
  fill: heatLegend.get("endColor")
});

// change this to template when possible
polygonSeries.events.on("datavalidated", function () {
  heatLegend.set("startValue", polygonSeries.getPrivate("valueLow"));
  heatLegend.set("endValue", polygonSeries.getPrivate("valueHigh"));
});


var title = chart.children.push(am5.Label.new(root, {
  text: "CyberSecurityreport ( Maleware)",
  fontSize: 20,
  x: am5.percent(50),
  centerX: am5.p50,
  y: 40
}));


/* =========================================================
   📊 Malware chart driven by data.json (non-intrusive)
   - Leaves existing globe/map code untouched
   - Dynamically creates filters (Année, Zone)
   - Renders an amCharts 5 horizontal bar chart
   ========================================================= */

(function () {
  const DATA_URL = 'data.json';

  // Create a lightweight section for filters + chart (no HTML change required)
  const section = document.createElement('section');
  section.id = 'malware-section';
  section.style.maxWidth = '1100px';
  section.style.margin = '40px auto';
  section.style.padding = '16px';
  section.style.borderRadius = '14px';
  section.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
  section.style.background = '#fff';

  section.innerHTML = `
    <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; margin-bottom:12px;">
      <h2 style="margin:0; font-size:22px;">Répartition des malwares</h2>
      <div style="display:flex; gap:8px; align-items:center;">
        <label style="font-weight:600;">Année
          <select id="yearSelect" style="margin-left:8px; padding:6px 10px; border-radius:10px; border:1px solid #ddd;"></select>
        </label>
        <label style="font-weight:600;">Zone
          <select id="zoneSelect" style="margin-left:8px; padding:6px 10px; border-radius:10px; border:1px solid #ddd;"></select>
        </label>
      </div>
    </div>
    <div id="malwareChart" style="width:100%; height:520px;"></div>
    <p id="chartNote" style="margin-top:10px; color:#666; font-size:12px;">
      Source: <code>data.json</code>. Les pourcentages représentent la part observée par type de malware dans l'échantillon filtré.
    </p>
  `;

  // Insert just after the globe container if present, otherwise at end of body
  const chartDiv = document.getElementById('chartdiv');
  if (chartDiv && chartDiv.parentNode) {
    chartDiv.parentNode.insertBefore(section, chartDiv.nextSibling);
  } else {
    document.body.appendChild(section);
  }

  const yearSel = section.querySelector('#yearSelect');
  const zoneSel = section.querySelector('#zoneSelect');

  // Helpers
  const normalizeTypeLabel = (t) => {
    if (!t) return '';
    // unify common inconsistencies in the dataset
    const map = {
      'agenttesla': 'AgentTesla',
      'agent tesla': 'AgentTesla',
      'formbook': 'FormBook',
      'lokibot': 'LokiBot',
      'snakekeylogger': 'SnakeKeylogger',
      'redline stealer': 'RedLine Stealer',
      'nanocore': 'NanoCore', // prefer consistent casing
      'njrat': 'NJRAT'
    };
    const k = t.toString().trim().toLowerCase().replace(/\s+/g,' ');
    return map[k] || t.toString().trim();
  };

  const normalizeZone = (z) => {
    if (!z) return '';
    // remove parenthetical clarifications like "EMEA (Europe, Middle East & Africa)"
    return z.toString().replace(/\s*\(.*?\)\s*/g,'').trim();
  };

  const toPct = (p) => {
    if (p == null) return 0;
    if (typeof p === 'number') return p;
    const m = String(p).match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  };

  fetch(DATA_URL)
    .then((r) => r.json())
    .then((raw) => {
      // shape data
      const rows = raw.map((d) => ({
        year: +d['Année'],
        zone: normalizeZone(d['Zone géographique']),
        typeLabel: normalizeTypeLabel(d['Type de malware']),
        pct: toPct(d['Pourcentage'])
      }));

      // build selects
      const years = Array.from(new Set(rows.map((r) => r.year))).sort();
      const zones = Array.from(new Set(rows.map((r) => r.zone))).sort((a,b)=>a.localeCompare(b));

      yearSel.innerHTML = years.map((y)=>`<option value="${y}">${y}</option>`).join('');
      zoneSel.innerHTML = zones.map((z)=>`<option value="${z}">${z}</option>`).join('');

      // Default to latest year + Global if exists else first zone
      yearSel.value = years[years.length - 1];
      const hasGlobal = zones.includes('Global');
      zoneSel.value = hasGlobal ? 'Global' : zones[0];

      // amCharts 5 setup (independent root to avoid touching the map)
      const root2 = am5.Root.new('malwareChart');
      root2.setThemes([ am5themes_Animated.new(root2) ]);

      const chart = root2.container.children.push(am5xy.XYChart.new(root2, {
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        layout: root2.verticalLayout
      }));

      const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root2, {
        categoryField: 'typeLabel',
        renderer: am5xy.AxisRendererY.new(root2, { inversed: true, minGridDistance: 20 }),
        tooltip: am5.Tooltip.new(root2, {})
      }));

      const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root2, {
        min: 0,
        maxPrecision: 1,
        renderer: am5xy.AxisRendererX.new(root2, {}),
        numberFormat: "#'%'"
      }));

      const series = chart.series.push(am5xy.ColumnSeries.new(root2, {
        name: 'Part (%)',
        xAxis,
        yAxis,
        valueXField: 'pct',
        categoryYField: 'typeLabel',
        tooltip: am5.Tooltip.new(root2, { labelText: '{categoryY}: {valueX}%' })
      }));

      series.columns.template.setAll({
        cornerRadiusTL: 10,
        cornerRadiusBL: 10,
        strokeOpacity: 0
      });

      const title = chart.children.unshift(am5.Label.new(root2, {
        text: '',
        fontSize: 18,
        x: am5.p50,
        centerX: am5.p50,
        paddingBottom: 6
      }));

      function getFilteredData(yr, zn) {
        // In case multiple rows for same type exist, keep the latest occurrence
        const filtered = rows.filter(r => r.year === +yr && r.zone === zn);
        // group by typeLabel
        const byType = new Map();
        filtered.forEach(r => byType.set(r.typeLabel, r.pct));
        // convert to array and sort descending by pct
        const arr = Array.from(byType, ([typeLabel, pct]) => ({ typeLabel, pct }))
          .sort((a,b)=>b.pct - a.pct);
        return arr;
      }

      function update() {
        const yr = +yearSel.value;
        const zn = zoneSel.value;
        const data = getFilteredData(yr, zn);
        yAxis.data.setAll(data);
        series.data.setAll(data);
        title.set('text', `Répartition par malware — ${zn} • ${yr}`);
      }

      yearSel.addEventListener('change', update);
      zoneSel.addEventListener('change', update);

      update();

      // Clean up when the page is unloaded to avoid memory leaks
      window.addEventListener('beforeunload', () => {
        root2.dispose();
      });
    })
    .catch((e) => {
      console.error('Erreur de chargement de data.json', e);
      const note = section.querySelector('#chartNote');
      if (note) {
        note.textContent = "Impossible de charger data.json.";
        note.style.color = '#c00';
      }
    });
})();
