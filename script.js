let linhasDeFundo = [];
let eventos = [
  { titulo: "Avaliação das propostas", data: " até 24.08" },
  { titulo: "Publicação dos resultados", data: "28.08" },
  { titulo: "Programação provisória", data: "15.09" },
  { titulo: "Inscrições para participar", data: "30.09 - 01.11" },
  { titulo: "Envio dos trabalhos", data: "até 01.11" },
  { titulo: "Programação final", data: "05.11" },
  { titulo: "Inscrições para assistir", data: "até 25.11" },
];

const CORES = {
  verde: "#46b2a3",
  roxo: "#6b4ca3",
  linhas: ["#ffc600", "#ff8ace", "#4cc1ec"]
};

// Configurações separadas para desktop e mobile
const CONFIG_DESKTOP = {
  linhasHorizontais: 20,
  linhasVerticais: 20,
  maxDistDeslocamento: 200,
  forcaDeslocamentoFundo: 6,
  forcaDeslocamentoPrincipal: 15,
  espessuraLinhaFundo: 4,
  espessuraLinhaPrincipal: 5
};

const CONFIG_MOBILE = {
  linhasHorizontais: 6,
  linhasVerticais: 4,
  maxDistDeslocamento: 120,
  forcaDeslocamentoFundo: 3,
  forcaDeslocamentoPrincipal: 10,
  espessuraLinhaFundo: 3,
  espessuraLinhaPrincipal: 4
};

// Deterministic pseudo-random generator (stable per size) used for small jitter
function deterministicRandom(n) {
  // combine index and canvas width to change jitter on resize while keeping it stable otherwise
  let seed = n * 12.9898 + (width || 1) * 0.001;
  let t = Math.sin(seed) * 43758.5453123;
  return t - Math.floor(t);
}

let isMobile = false;
let CONFIG = CONFIG_DESKTOP;
let touchX = 0, touchY = 0;
let mouseXAnt = 0, mouseYAnt = 0;
let tempoUltimaAtualizacao = 0;
const INTERVALO_ATUALIZACAO = 16;

function setup() {
  let container = document.getElementById("canvas-wrapper");
  if (!container) {
    console.error("Canvas container not found!");
    return;
  }

  detectarDispositivo();
  
  let alturaCanvas = isMobile ? windowHeight * 0.9: windowHeight * 0.8;
  alturaCanvas = Math.max(alturaCanvas, isMobile ? 800 : 500);
  
  let canvas = createCanvas(windowWidth, alturaCanvas);
  canvas.elt.id = "p5-canvas";
  canvas.parent("canvas-wrapper");
  // make canvas element responsive in CSS pixels while keeping drawing buffer full-size
  //canvas.elt.style.maxWidth = '100%';
  canvas.elt.style.height = 'auto';

  // Ensure mouse globals have sensible defaults so the displacement math is stable
  window.mouseX = window.mouseX || width * 0.5;
  window.mouseY = window.mouseY || height * 0.5;

  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  
  if (isMobile) {
    // use passive listeners so the page can still scroll; we'll detect taps separately
    canvas.elt.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.elt.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.elt.addEventListener('touchend', handleTouchEnd, { passive: true });
  }
  
  gerarLinhasDeFundo();
}

function detectarDispositivo() {
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             window.innerWidth <= 768;
  CONFIG = isMobile ? CONFIG_MOBILE : CONFIG_DESKTOP;
}

// touch handling split into start/move/end so we don't block native scrolling
let _touchStartX = 0, _touchStartY = 0, _touchStartTime = 0;
let _touchMoved = false;

function handleTouchStart(e) {
  if (!e.touches || e.touches.length === 0) return;
  let rect = e.target.getBoundingClientRect();
  _touchStartX = e.touches[0].clientX;
  _touchStartY = e.touches[0].clientY;
  _touchStartTime = millis();
  _touchMoved = false;
  // set mouse position for displacement visuals but do not prevent scroll
  touchX = _touchStartX - rect.left;
  touchY = _touchStartY - rect.top;
  mouseX = touchX;
  mouseY = touchY;
}

function handleTouchMove(e) {
  if (!e.touches || e.touches.length === 0) return;
  let rect = e.target.getBoundingClientRect();
  let tx = e.touches[0].clientX;
  let ty = e.touches[0].clientY;
  // detect movement beyond a small threshold to know it's a scroll/drag
  if (Math.abs(tx - _touchStartX) > 10 || Math.abs(ty - _touchStartY) > 10) {
    _touchMoved = true;
  }
  touchX = tx - rect.left;
  touchY = ty - rect.top;
  mouseX = touchX;
  mouseY = touchY;
}

function handleTouchEnd(e) {
  // determine if this was a tap (short duration, small movement)
  let dt = millis() - _touchStartTime;
  if (!_touchMoved && dt < 300) {
    // convert last known touch coords to canvas-local and handle tap
    handleTap(touchX, touchY);
  }
  // reset move flag
  _touchMoved = false;
}

// Simple tap handler: find which box was tapped and flash it briefly
let _flashIndex = -1;
let _flashUntil = 0;

function handleTap(cx, cy) {
  // find which event box contains point (cx,cy)
  // we must recompute positions similarly to mobile drawing
  let centroX = width * 0.5;
  let boxW = Math.min(width * 0.86, 440);
  let localBoxH = constrain(boxW * 0.24, 40, 140);
  // try to mirror the layout computation: iterate to estimate gap/margin
  let n = eventos.length;
  let boxH = localBoxH;
  let gap = Math.max(boxH * 0.5, 12);
  let margin = Math.max(height * 0.06, boxH * 0.6);
  for (let iter = 0; iter < 6; iter++) {
    margin = Math.max(height * 0.06, boxH * 0.6);
    let available = height - 2 * margin;
    let contentH = n * boxH;
    if (n > 1) {
      gap = (available - contentH) / (n - 1);
      gap = constrain(gap, boxH * 0.25, Math.max(boxH * 1.2, height * 0.18));
    } else {
      gap = 0;
    }
    if (available < contentH + (n - 1) * (boxH * 0.25)) {
      boxH = boxH * 0.92;
      boxH = constrain(boxH, 40, 140);
      continue;
    }
    break;
  }
  let inicioY = margin + boxH * 0.5;
  for (let i = 0; i < eventos.length; i++) {
    let bx = centroX;
    let by = inicioY + i * (boxH + gap);
    // check hit in local canvas coords
    if (cx >= bx - boxW * 0.5 && cx <= bx + boxW * 0.5 && cy >= by - boxH * 0.5 && cy <= by + boxH * 0.5) {
      _flashIndex = i;
      _flashUntil = millis() + 400; // flash for 400ms
      // open the same link a desktop click would (do not block the UI)
      try {
        window.open('https://app.ciente.studio/xiconginternacionalsobreculturas', '_blank');
      } catch (err) {
        // ignore popup blockers — visual feedback still helps
      }
      return;
    }
  }
}

function draw() {
  let agora = millis();
  if (agora - tempoUltimaAtualizacao < INTERVALO_ATUALIZACAO) return;
  tempoUltimaAtualizacao = agora;

  background(255);
  desenharFundo();
  
  if (isMobile) {
    desenharTimelineMobile();
  } else {
    desenharTimelineDesktop();
  }
  
  mouseXAnt = mouseX;
  mouseYAnt = mouseY;
}

function gerarLinhasDeFundo() {
  linhasDeFundo = [];
  
  function criarLinha(startX, startY, direcoes, condicaoParada) {
    let linha = {
      segmentos: [],
      cor: color(CORES.linhas[linhasDeFundo.length % CORES.linhas.length]),
      espessura: CONFIG.espessuraLinhaFundo
    };

    let x = startX, y = startY;
    let direcaoAtual = random(direcoes);

    while (condicaoParada(x, y)) {
      let len = isMobile ? random(50, 100) : random(80, 160);
      let inicioX = x, inicioY = y;

      switch(direcaoAtual) {
        case "horizontal": x += len; break;
        case "vertical": y += len; break;
        case "diagonal-up":
          x += len * 0.7; y -= len * 0.7;
          y = constrain(y, -50, height + 50);
          break;
        case "diagonal-down":
          x += len * 0.7; y += len * 0.7;
          y = constrain(y, -50, height + 50);
          break;
      }

      linha.segmentos.push({ x1: inicioX, y1: inicioY, x2: x, y2: y });
      if (random() < 0.3) direcaoAtual = random(direcoes);
    }
    return linha;
  }

  // Linhas horizontais
  for (let i = 0; i < CONFIG.linhasHorizontais; i++) {
    linhasDeFundo.push(criarLinha(
      random(-200, -50), random(height * 0.1, height * 0.9),
      ["horizontal", "diagonal-up", "diagonal-down"],
      (x, y) => x < width + 200
    ));
  }
  
  // Linhas verticais
  for (let i = 0; i < CONFIG.linhasVerticais; i++) {
    linhasDeFundo.push(criarLinha(
      random(width * 0.1, width * 0.9), random(-200, -50),
      ["vertical", "diagonal-up", "diagonal-down"],
      (x, y) => y < height + 200
    ));
  }
}

function desenharFundo() {
  strokeCap(ROUND);
  strokeJoin(ROUND);
  noFill();

  for (let linha of linhasDeFundo) {
    if (linha.segmentos.length === 0) continue;
    
    stroke(linha.cor);
    strokeWeight(linha.espessura);
    beginShape();
    
    let inicio = deslocarFundo(linha.segmentos[0].x1, linha.segmentos[0].y1);
    vertex(inicio.x, inicio.y);

    for (let i = 0; i < linha.segmentos.length; i++) {
      let seg = linha.segmentos[i];
      let fim = deslocarFundo(seg.x2, seg.y2);

      if (i === linha.segmentos.length - 1) {
        vertex(fim.x, fim.y);
      } else {
        let prox = linha.segmentos[i + 1];
        let raio = linha.espessura * 1.5;

        let dx1 = seg.x2 - seg.x1, dy1 = seg.y2 - seg.y1;
        let len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        let dx2 = prox.x2 - prox.x1, dy2 = prox.y2 - prox.y1;
        let len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (len1 > 0 && len2 > 0) {
          dx1 /= len1; dy1 /= len1; dx2 /= len2; dy2 /= len2;
          let distIni = Math.min(raio, len1 * 0.3);
          let distFim = Math.min(raio, len2 * 0.3);

          let curvaIni = deslocarFundo(seg.x2 - dx1 * distIni, seg.y2 - dy1 * distIni);
          let controle = deslocarFundo(seg.x2, seg.y2);
          let curvaFim = deslocarFundo(seg.x2 + dx2 * distFim, seg.y2 + dy2 * distFim);

          vertex(curvaIni.x, curvaIni.y);
          quadraticVertex(controle.x, controle.y, curvaFim.x, curvaFim.y);
        }
      }
    }
    endShape();
  }
}

// VERSÃO DESKTOP (layout original com offsets)
function desenharTimelineDesktop() {
  let centroX = width * 0.5;

  // We'll compute symmetric top/bottom margins so the first and last items
  // sit with similar spacing to canvas edges. Use a small iterative
  // approach to stabilize boxH and espacoY.
  let n = eventos.length;
  if (n <= 1) {
    // single item: center vertically
    let boxW = Math.min(width * 0.27, 520);
    let boxH = Math.min(height * 0.12, 140);
    let raioBox = boxH * 0.33;
    let inicioY = height * 0.5;
    let pos = deslocar(centroX, inicioY);
  // Linha central ajustada: desenhar segmentos que comecem/terminem fora da tela
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  let offMargin = Math.max(200, CONFIG.maxDistDeslocamento * 2);
  line(pos.x, -offMargin, pos.x, pos.y - boxH * 0.5);
  line(pos.x, pos.y + boxH * 0.5, pos.x, height + offMargin);
    // Box
    fill(CORES.verde);
    stroke(CORES.roxo);
    strokeWeight(CONFIG.espessuraLinhaPrincipal);
    rect(pos.x, pos.y, boxW, boxH, raioBox);
    desenharTextoDesktop(eventos[0], pos.x, pos.y, boxW, boxH);
    return;
  }

  // initial guesses
  let boxW = Math.min(width * 0.27, 520);
  let boxH = Math.min(height * 0.09, 120);

  // iterate a couple of times to stabilize spacing
  let margin = 0, espacoY = 0;
  for (let iter = 0; iter < 2; iter++) {
    margin = Math.max(height * 0.08, boxH * 0.8);
    // ensure there's at least some available space
    let available = Math.max(height - 2 * margin, height * 0.25);
    espacoY = available / (n - 1);
    espacoY = Math.min(espacoY, height * 0.18);
    boxH = Math.min(height * 0.09, espacoY * 0.75, 140);
  }
  let raioBox = boxH * 0.33;
  let inicioY = margin;

  // Calculate automatic offsets for desktop: alternate left/right but keep them closer to center
  // Use smaller base offset and add a small deterministic jitter so layout feels organic
  let baseOffset = Math.min(width * 0.11, 140); // reduced from previous
  let posicoes = eventos.map((evento, i) => {
    let side = (i % 2 === 0) ? 1 : -1;
    let factor = 1 + Math.floor(i / 2) * 0.06; // much smaller increase
    // deterministic jitter in range [-0.18, 0.18] of baseOffset
    let jitter = (deterministicRandom(i) - 0.5) * 0.36;
    let offsetX = side * baseOffset * (factor + jitter);
    let baseX = centroX + offsetX;
    // keep boxes near center but allow reasonable margin
    let margin = Math.max(boxW * 0.5, 36);
    baseX = constrain(baseX, margin, width - margin);
    let baseY = inicioY + i * espacoY;
    return deslocar(baseX, baseY);
  });

  // Linha inicial (começa fora da tela para esconder endpoints)
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  let offMargin = Math.max(200, CONFIG.maxDistDeslocamento * 2);
  line(posicoes[0].x, -offMargin, posicoes[0].x, posicoes[0].y - boxH * 0.5);

  for (let i = 0; i < eventos.length; i++) {
    let pos = posicoes[i];
    let evento = eventos[i];

    // Linhas de conexão
    if (i < eventos.length - 1) {
      let nextPos = posicoes[i + 1];
      let midY = (pos.y + nextPos.y) * 0.5;
      stroke(CORES.roxo);
      strokeWeight(CONFIG.espessuraLinhaPrincipal);
      line(pos.x, pos.y + boxH * 0.5, pos.x, midY);
      line(pos.x, midY, nextPos.x, midY);
      line(nextPos.x, midY, nextPos.x, nextPos.y - boxH * 0.5);
    }

    // Caixa do evento
    if (_flashIndex === i && millis() < _flashUntil) {
      // brighter flash color for tap feedback
      fill(lerpColor(color(CORES.verde), color(255, 255, 255), 0.18));
    } else {
      fill(CORES.verde);
    }
    stroke(CORES.roxo);
    strokeWeight(CONFIG.espessuraLinhaPrincipal);
    rect(pos.x, pos.y, boxW, boxH, raioBox);

    // Texto desktop
    desenharTextoDesktop(evento, pos.x, pos.y, boxW, boxH);
  }

  // Linha final (termina fora da tela para esconder endpoints)
  let ultimaPos = posicoes[posicoes.length - 1];
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(ultimaPos.x, ultimaPos.y + boxH * 0.5, ultimaPos.x, height + Math.max(200, CONFIG.maxDistDeslocamento * 2));
}

// VERSÃO MOBILE (layout vertical simples)
function desenharTimelineMobile() {
  let centroX = width * 0.5;
  let n = eventos.length;
  // choose box width/height constraints
  let boxW = Math.min(width * 0.86, 440);
  // initial box height proportional to box width
  let boxH = constrain(boxW * 0.24, 48, 110);
  let gap = Math.max(boxH * 0.5, 12);
  let margin = 0;

  // Iteratively shrink boxH if there's not enough vertical space so items don't overlap.
  for (let iter = 0; iter < 6; iter++) {
    margin = Math.max(height * 0.06, boxH * 0.6);
    let available = height - 2 * margin;
    let contentH = n * boxH;
    // If only one item, no gap needed
    if (n > 1) {
      gap = (available - contentH) / (n - 1);
      // enforce sensible bounds on gap
      gap = constrain(gap, boxH * 0.25, Math.max(boxH * 1.2, height * 0.18));
    } else {
      gap = 0;
    }

    // If available space is too small even with minimal gap, shrink boxH and retry
    if (available < contentH + (n - 1) * (boxH * 0.25)) {
      boxH = boxH * 0.92; // shrink slightly and iterate
      boxH = constrain(boxH, 40, 140);
      continue;
    }
    break;
  }

  let raioBox = boxH * 0.25;
  // start Y so first item centers at margin + boxH/2
  let inicioY = margin + boxH * 0.5;
  // Posições simples - só vertical, sem offsets
  let posicoes = eventos.map((evento, i) => {
    let baseX = centroX; // Sempre centralizado
    let baseY = inicioY + i * (boxH + gap);
    return deslocar(baseX, baseY);
  });

  // Linha inicial: comece fora da tela para esconder endpoints
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  let offMarginMobile = Math.max(200, CONFIG.maxDistDeslocamento * 2);
  line(centroX, -offMarginMobile, centroX, posicoes[0].y - boxH * 0.5);

  for (let i = 0; i < eventos.length; i++) {
    let pos = posicoes[i];
    let evento = eventos[i];

    // Linha de conexão simples (só vertical)
    if (i < eventos.length - 1) {
      let nextPos = posicoes[i + 1];
      stroke(CORES.roxo);
      strokeWeight(CONFIG.espessuraLinhaPrincipal);
      line(pos.x, pos.y + boxH * 0.5, nextPos.x, nextPos.y - boxH * 0.5);
    }

    // Caixa do evento
    if (_flashIndex === i && millis() < _flashUntil) {
      fill(lerpColor(color(CORES.verde), color(255, 255, 255), 0.18));
    } else {
      fill(CORES.verde);
    }
    stroke(CORES.roxo);
    strokeWeight(CONFIG.espessuraLinhaPrincipal);
    rect(pos.x, pos.y, boxW, boxH, raioBox);

    // Texto mobile
    desenharTextoMobile(evento, pos.x, pos.y, boxW, boxH);
  }

  // Linha final (termina fora da tela para esconder endpoints)
  let ultimaPos = posicoes[posicoes.length - 1];
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(ultimaPos.x, ultimaPos.y + boxH * 0.5, ultimaPos.x, height + Math.max(200, CONFIG.maxDistDeslocamento * 2));
}

function desenharTextoDesktop(evento, x, y, boxW, boxH) {
  noStroke();
    textAlign(CENTER, CENTER);
  
  // Data à esquerda, maior
  fill(CORES.roxo);
  textStyle(BOLD);
  // set text size but clamp to readable range and ensure it fits near the right edge
  let dateSize = constrain(boxH * 0.45, 12, 36);
  textSize(dateSize);
  // desired margin from the right edge of the box
  let dateMargin = Math.max(boxW * 0.06, 8);
  // maximum width available for the date (right half of the box minus margin)
  let maxDateWidth = boxW * 0.5 - dateMargin;
  while (textWidth(evento.data) > maxDateWidth && dateSize > 8) {
    dateSize -= 1;
    textSize(dateSize);
  }
  // draw date right-aligned at a fixed distance from the box right edge
  textAlign(RIGHT, CENTER);
  text(evento.data, x + boxW * 0.5 - dateMargin, y );
  // restore center alignment for subsequent title drawing
  textAlign(CENTER, CENTER);
  
  // Título à direita, menor
  fill(255);
  textStyle(NORMAL);
  // responsive title size and wrapping
  textSize(constrain(boxH * 0.32, 10, 28));
  let titleX = x - boxW * 0.2;
  let maxWidth = boxW * 0.5;
  let lines = wrapText(evento.titulo, maxWidth);
  // compute a safe lineHeight: at least a fraction of boxH, or enough for the font metrics
  let lineHeight = Math.max(boxH * 0.20, textAscent() + textDescent() + 6);
  for (let i = 0; i < lines.length; i++) {
    let lineY = y - (lines.length - 1) * (lineHeight * 0.5) + i * lineHeight;
    text(lines[i], titleX, lineY);
  }
}

function desenharTextoMobile(evento, x, y, boxW, boxH) {
  noStroke();
  
  // Layout empilhado vertical para mobile
  // Data em cima, grande e destacada
  fill(CORES.roxo);
  textStyle(BOLD);
  // date size derived from boxH but also constrained by boxW
  let dateSizeMobile = constrain(boxH * 0.30, 12, Math.max(18, boxW * 0.04));
  textSize(dateSizeMobile);
  let maxDateWidthMobile = boxW * 0.9;
  while (textWidth(evento.data) > maxDateWidthMobile && dateSizeMobile > 8) {
    dateSizeMobile -= 1;
    textSize(dateSizeMobile);
  }
  textAlign(CENTER, CENTER);
  text(evento.data, x, y - boxH * 0.18);

  // Título embaixo, responsivo
  fill(255);
  textStyle(NORMAL);
  let titleSize = constrain(boxH * 0.26, 12, 22);
  textSize(titleSize);
  textAlign(CENTER, CENTER);
  let maxWidth = boxW * 0.86;
  let lines = wrapText(evento.titulo, maxWidth);
  let lineHeight = Math.max(boxH * 0.20, textAscent() + textDescent() + 6);
  // center the block vertically below the date
  let totalH = lines.length * lineHeight;
  let startY = y + boxH * 0.05 - totalH * 0.5 + lineHeight * 0.5;
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x, startY + i * lineHeight);
  }
}

// Helper: wrap a string into multiple lines so that textWidth(line) <= maxWidth
function wrapText(str, maxWidth) {
  // quick path
  if (textWidth(str) <= maxWidth) return [str];
  let words = str.split(' ');
  let lines = [];
  let current = words[0] || '';
  for (let i = 1; i < words.length; i++) {
    let w = words[i];
    let test = current + ' ' + w;
    if (textWidth(test) <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  // if still too many lines, try to merge to max 2 lines by truncation
  if (lines.length > 3) {
    // keep first two and join the rest into third with ellipsis
    let first = lines[0];
    let second = lines[1];
    let rest = lines.slice(2).join(' ');
    // shorten rest until fits
    while (textWidth(rest + '...') > maxWidth && rest.length > 0) {
      rest = rest.slice(0, -1);
    }
    lines = [first, second, rest + (rest.length ? '...' : '')];
  }
  return lines;
}

function deslocarFundo(x, y) {
  let dx = x - mouseX, dy = y - mouseY;
  let distSq = dx * dx + dy * dy;
  let maxDistSq = CONFIG.maxDistDeslocamento * CONFIG.maxDistDeslocamento;

  if (distSq < maxDistSq) {
    let d = Math.sqrt(distSq);
    let forca = map(d, 0, CONFIG.maxDistDeslocamento, CONFIG.forcaDeslocamentoFundo, 0);
    return { x: x + (dx / d) * forca, y: y + (dy / d) * forca };
  }
  return { x, y };
}

function deslocar(x, y) {
  let dx = x - mouseX, dy = y - mouseY;
  let distSq = dx * dx + dy * dy;
  let maxDistSq = CONFIG.maxDistDeslocamento * CONFIG.maxDistDeslocamento;

  if (distSq < maxDistSq) {
    let d = Math.sqrt(distSq);
    let forca = map(d, 0, CONFIG.maxDistDeslocamento, CONFIG.forcaDeslocamentoPrincipal, 0);
    return { x: x + (dx / d) * forca, y: y + (dy / d) * forca };
  }
  return { x, y };
}

function windowResized() {
  detectarDispositivo();
  let alturaCanvas = isMobile ? windowHeight * 0.9 : windowHeight * 0.8;
  alturaCanvas = Math.max(alturaCanvas, isMobile ? 600 : 400);
  resizeCanvas(windowWidth, alturaCanvas);
  gerarLinhasDeFundo();
}
