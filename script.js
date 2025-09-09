let linhasDeFundo = [];
let eventos = [
  { titulo: "Avaliação das propostas", data: " até 24.08", offsetX: 0 },
  { titulo: "Publicação dos resultados", data: "28.08", offsetX: -190 },
  { titulo: "Programação provisória", data: "15.09", offsetX: 130 },
  { titulo: "Período de inscrições", data: "15.09 - 31.10", offsetX: -150 },
  { titulo: "Envio dos trabalhos", data: "até 31.10", offsetX: 60 },
  { titulo: "Programação final", data: "05.11", offsetX: 0 },
];

const CORES = {
  verde: "#46b2a3",
  roxo: "#6b4ca3",
  linhas: ["#ffc600", "#ff8ace", "#4cc1ec"]
};

// Configurações separadas para desktop e mobile
const CONFIG_DESKTOP = {
  linhasHorizontais: 15,
  linhasVerticais: 10,
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
  
  let alturaCanvas = isMobile ? windowHeight * 0.9 : windowHeight * 0.8;
  alturaCanvas = Math.max(alturaCanvas, isMobile ? 600 : 400);
  
  let canvas = createCanvas(windowWidth, alturaCanvas);
  canvas.elt.id = "p5-canvas";
  canvas.parent("canvas-wrapper");

  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  
  if (isMobile) {
    canvas.elt.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.elt.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.elt.addEventListener('touchend', handleTouchEnd, { passive: false });
  }
  
  gerarLinhasDeFundo();
}

function detectarDispositivo() {
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             window.innerWidth <= 768;
  CONFIG = isMobile ? CONFIG_MOBILE : CONFIG_DESKTOP;
}

function handleTouch(e) {
  e.preventDefault();
  if (e.touches.length > 0) {
    let rect = e.target.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
    touchY = e.touches[0].clientY - rect.top;
    mouseX = touchX;
    mouseY = touchY;
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
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
  let inicioY = height * 0.14;
  let espacoY = height * 0.15;
  let boxW = width * 0.27;
  let boxH = height * 0.09;
  let raioBox = boxH * 0.33;

  let posicoes = eventos.map((evento, i) => {
    let baseX = centroX + evento.offsetX;
    let baseY = inicioY + i * espacoY;
    return deslocar(baseX, baseY);
  });

  // Linha inicial
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(posicoes[0].x, -boxH * 2.5, posicoes[0].x, posicoes[0].y - boxH * 0.5);

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
    fill(CORES.verde);
    stroke(CORES.roxo);
    strokeWeight(CONFIG.espessuraLinhaPrincipal);
    rect(pos.x, pos.y, boxW, boxH, raioBox);

    // Texto desktop
    desenharTextoDesktop(evento, pos.x, pos.y, boxW, boxH);
  }

  // Linha final
  let ultimaPos = posicoes[posicoes.length - 1];
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(ultimaPos.x, ultimaPos.y + boxH * 0.5, ultimaPos.x, height + boxH);
}

// VERSÃO MOBILE (layout vertical simples)
function desenharTimelineMobile() {
  let centroX = width * 0.5;
  let inicioY = height * 0.1;
  let espacoY = height * 0.13; // Espaçamento maior para evitar sobreposição
  let boxW = Math.min(width * 0.85, 320); // Largura fixa máxima
  let boxH = 60; // Altura fixa para consistência
  let raioBox = boxH * 0.25;

  // Posições simples - só vertical, sem offsets
  let posicoes = eventos.map((evento, i) => {
    let baseX = centroX; // Sempre centralizado
    let baseY = inicioY + i * espacoY;
    return deslocar(baseX, baseY);
  });

  // Linha inicial
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(centroX, 0, centroX, posicoes[0].y - boxH * 0.5);

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
    fill(CORES.verde);
    stroke(CORES.roxo);
    strokeWeight(CONFIG.espessuraLinhaPrincipal);
    rect(pos.x, pos.y, boxW, boxH, raioBox);

    // Texto mobile
    desenharTextoMobile(evento, pos.x, pos.y, boxW, boxH);
  }

  // Linha final
  let ultimaPos = posicoes[posicoes.length - 1];
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(ultimaPos.x, ultimaPos.y + boxH * 0.5, ultimaPos.x, height);
}

function desenharTextoDesktop(evento, x, y, boxW, boxH) {
  noStroke();
    textAlign(CENTER, CENTER);
  
  // Data à esquerda, maior
  fill(CORES.roxo);
  textStyle(BOLD);
  textSize(boxH * 0.45);
  //textAlign(RIGHT, CENTER);
  text(evento.data, x + boxW * 0.3, y );
  
  // Título à direita, menor
  fill(255);
  textStyle(NORMAL);
  textSize(boxH * 0.35);
  //textAlign(LEFT, CENTER);
  text(evento.titulo, x - boxW * 0.2, y);
}

function desenharTextoMobile(evento, x, y, boxW, boxH) {
  noStroke();
  
  // Layout empilhado vertical para mobile
  // Data em cima, grande e destacada
  fill(CORES.roxo);
  textStyle(BOLD);
  textSize(20); // Tamanho fixo para consistência
  textAlign(CENTER, CENTER);
  text(evento.data, x, y + boxH * 0.2);
  
  // Título embaixo, menor mas legível
  fill(255);
  textStyle(NORMAL);
  textSize(18); // Tamanho fixo menor
  textAlign(CENTER, CENTER);
  
  // Quebrar título se muito longo
  if (textWidth(evento.titulo) > boxW * 0.8) {
    let palavras = evento.titulo.split(' ');
    let linha1 = '', linha2 = '';
    let metade = Math.ceil(palavras.length / 2);
    
    linha1 = palavras.slice(0, metade).join(' ');
    linha2 = palavras.slice(metade).join(' ');
    
    text(linha1, x, y - boxH * 0.1);
    text(linha2, x, y - boxH * 0.25);
  } else {
    text(evento.titulo, x, y - boxH * 0.15);
  }
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
