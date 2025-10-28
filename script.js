/**
 * ---------------------------------------
 * Version complète — Globe + Carte + Tooltip JSON
 * ---------------------------------------
 */

var root = am5.Root.new("chartdiv");

// Thème animé
root.setThemes([
  am5themes_Animated.new(root)
]);

// Création de la carte
var chart = root.container.children.push(am5map.MapChart.new(root, {
  panX: "rotateX",
  panY: "translateY",
  projection: am5map.geoMercator(),
  homeGeoPoint: { latitude: 2, longitude: 2 }
}));

// Conteneur pour le bouton Globe/Map
var cont = chart.children.push(am5.Container.new(root, {
  layout: root.horizontalLayout,
  x: 20,
  y: 40
}));

// Label "Map"
cont.children.push(am5.Label.new(root, {
  centerY: am5.p50,
  text: "Map"
}));

// Bouton pour changer la projection
var switchButton = cont.children.push(am5.Button.new(root, {
  themeTags: ["switch"],
  centerY: am5.p50,
  icon: am5.Circle.new(root, { themeTags: ["icon"] })
}));

// Événement : clic sur le bouton pour changer entre carte et globe
switchButton.on("active", function() {
  if (!switchButton.get("active")) {
    // Vue carte (plate)
    chart.set("projection", am5map.geoMercator());
    chart.set("panY", "translateY");
    chart.set("rotationY", 0);
    backgroundSeries.mapPolygons.template.set("fillOpacity", 0);
  } else {
    // Vue globe
    chart.set("projection", am5map.geoOrthographic());
    chart.set("panY", "rotateY");
    backgroundSeries.mapPolygons.template.set("fillOpacity", 0.1);
  }
});

// Label "Globe"
cont.children.push(am5.Label.new(root, {
  centerY: am5.p50,
  text: "Globe"
}));

// Fond du globe
var backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
backgroundSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"),
  fillOpacity: 0,
  strokeOpacity: 0
});

// Ajout du fond (rectangle du globe)
backgroundSeries.data.push({
  geometry: am5map.getGeoRectangle(90, 180, -90, -180)
});

// Série principale pour les pays
var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow
}));

// Ajouter le tooltip pour afficher le nom du pays au survol
polygonSeries.mapPolygons.template.setAll({
  tooltipText: "{name}", // nom du pays
  interactive: true,
  stroke: am5.color(0xffffff),
  strokeWidth: 1
});

// Charger ton JSON et associer les données aux zones
fetch("data.json")
  .then(response => response.json())
  .then(data => {
    var dataByZone = {};
    data.forEach(item => {
      if(!dataByZone[item["Zone géographique"]]) {
        dataByZone[item["Zone géographique"]] = [];
      }
      dataByZone[item["Zone géographique"]].push(item);
    });

    // Boucle sur les polygones de la carte
    polygonSeries.mapPolygons.each(function(polygon) {
      var zoneName = polygon.dataItem.dataContext.name; // nom du pays dans le geoJSON
      if(dataByZone[zoneName]) {
        var info = dataByZone[zoneName].map(d => `${d["Type de malware"]}: ${d["Pourcentage"]}`).join("\n");
        polygon.set("tooltipText", zoneName + "\n" + info);
      }
    });
  });

// Animation d’apparition
chart.appear(1000, 100);
