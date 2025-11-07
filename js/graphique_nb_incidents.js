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
