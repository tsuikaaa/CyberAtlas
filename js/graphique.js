am5.ready(function () {
  const root = am5.Root.new("chartdiv");
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
