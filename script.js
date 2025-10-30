var bulletColor = am5.color(0xc83830);
var polygonColor = am5.color(0xd9cec8);

// Initialisation de la carte
var root = am5.Root.new("chartdiv");
root._logo.dispose();

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

graticuleSeries.mapLines.template.set("strokeOpacity", 0.05);

var cont = chart.children.push(am5.Container.new(root, {
  layout: root.horizontalLayout,
  x: am5.percent(15),
  centerX: 0,
  y: am5.percent(100),
  dy: -40
}));

// Labels et switch globe/map
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

// Séries de polygones
var polygonSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow,
    valueField: "threatened",
    calculateAggregates: true,
    exclude: ["AQ"]
  })
);

polygonSeries.mapPolygons.template.setAll({
  tooltipText: "{name} {value}%",
  fill: polygonColor,
  stroke: am5.color(0xffffff)
});

// Titre
var title = chart.children.push(am5.Label.new(root, {
  text: "CyberSecurityreport (Malware)",
  fontSize: 20,
  x: am5.percent(50),
  centerX: am5.p50,
  y: 40
}));

// Charger les données depuis data.json
fetch("data.json")
  .then(response => response.json())
  .then(jsonData => {
    console.log("Données chargées :", jsonData);

    // Fonction pour mettre à jour la carte selon l'année
    function updateMapData(year) {
      var filteredData = jsonData.filter(item => item["Année"] == year);
      var mapData = filteredData.map(item => ({
        id: item["Zone géographique"], // à adapter si tu veux mapper les codes pays exacts
        value: parseFloat(item["Pourcentage"])
      }));

      polygonSeries.data.setAll(mapData);
      console.log("Carte mise à jour pour l'année :", year, mapData);
    }

    // Boutons année
    var yearButtons = document.querySelectorAll(".year-btn");

    yearButtons.forEach(function(btn) {
      btn.addEventListener("click", function() {
        yearButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        var selectedYear = btn.getAttribute("data-year");
        console.log("Bouton cliqué :", btn.textContent);
        console.log("Année sélectionnée :", selectedYear);

        updateMapData(selectedYear);
      });
    });

    // Charger l'année par défaut (premier bouton)
    if (yearButtons.length > 0) {
      var defaultYear = yearButtons[0].getAttribute("data-year");
      updateMapData(defaultYear);
    }
  })
  .catch(err => console.error("Erreur lors du chargement du JSON :", err));
