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