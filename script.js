let linhasDeFundo = [];
let eventos = [
  { titulo: "Avaliação das propostas", data: "31.07 - 24.08", offsetX: 0 },
  { titulo: "Publicação dos resultados", data: "28.08", offsetX: -190 },
  { titulo: "Programação provisória", data: "10.09", offsetX: 130 },
  { titulo: "Período de inscrições", data: "10.09 - 31.10", offsetX: -150 },
  { titulo: "Envio dos textos completos", data: "até 31.10", offsetX: 60 },
  { titulo: "Divulgação do programa final", data: "05.11", offsetX: 0 },
];

const CORES = {
  verde: "#46b2a3",
  roxo: "#6b4ca3",
  linhasSite: ["#ffc600", "#ff8ace", "#4cc1ec"],
  linhasGTs: ["#7dcbdd", "#a8e347", "#ee627e","#007989", "#ffc600", "#6b4ca3","#e7eb96", "#2b5c3c", "#ba4172",]
};

const CONFIG = {
  linhasHorizontais: 15,
  linhasVerticais: 10,
  maxDistDeslocamento: 200,
  forcaDeslocamentoFundo: 6,
  forcaDeslocamentoPrincipal: 15,
  espessuraLinhaFundo: 4,
  espessuraLinhaPrincipal: 5
};

// Cache para otimizações
let mouseXAnt = 0, mouseYAnt = 0;
let tempoUltimaAtualizacao = 0;
const INTERVALO_ATUALIZACAO = 16; // ~60fps

function setup() {
  let container = document.getElementById("canvas-wrapper");
  if (!container) {
    console.error("Canvas container not found!");
    return;
  }

  let canvas = createCanvas(windowWidth, windowHeight * 0.8);
  canvas.elt.id = "p5-canvas";
  canvas.parent("canvas-wrapper");

  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  gerarLinhasDeFundo();
}

function draw() {
  // Throttling para melhor performance
  let agora = millis();
  if (agora - tempoUltimaAtualizacao < INTERVALO_ATUALIZACAO) return;
  tempoUltimaAtualizacao = agora;

  background(255);
  desenharFundo();
  desenharLinhaPrincipal();
  
  mouseXAnt = mouseX;
  mouseYAnt = mouseY;
}

function gerarLinhasDeFundo() {
  linhasDeFundo = [];
  
  // Função helper para gerar uma linha
  function criarLinha(startX, startY, direcoes, condicaoParada) {
    let linha = {
      segmentos: [],
      cor: color(CORES.linhasSite[linhasDeFundo.length % CORES.linhasSite.length]),
      espessura: CONFIG.espessuraLinhaFundo,
      pontos: [] // Cache de pontos deslocados
    };

    let x = startX, y = startY;
    let direcaoAtual = random(direcoes);

    while (condicaoParada(x, y)) {
      let len = random(80, 160);
      let inicioX = x, inicioY = y;

      // Usar switch para melhor performance
      switch(direcaoAtual) {
        case "horizontal":
          x += len;
          break;
        case "vertical":
          y += len;
          break;
        case "diagonal-up":
          x += len * 0.7;
          y -= len * 0.7;
          y = constrain(y, -50, height + 50);
          break;
        case "diagonal-down":
          x += len * 0.7;
          y += len * 0.7;
          y = constrain(y, -50, height + 50);
          break;
      }

      linha.segmentos.push({ x1: inicioX, y1: inicioY, x2: x, y2: y });

      if (random() < 0.3) {
        direcaoAtual = random(direcoes);
      }
    }

    return linha;
  }

  // Gerar linhas horizontais
  for (let i = 0; i < CONFIG.linhasHorizontais; i++) {
    let linha = criarLinha(
      random(-200, -50),
      random(height * 0.1, height * 0.9),
      ["horizontal", "diagonal-up", "diagonal-down"],
      (x, y) => x < width + 200
    );
    linhasDeFundo.push(linha);
  }
  
  // Gerar linhas verticais
  for (let i = 0; i < CONFIG.linhasVerticais; i++) {
    let linha = criarLinha(
      random(width * 0.1, width * 0.9),
      random(-200, -50),
      ["vertical", "diagonal-up", "diagonal-down"],
      (x, y) => y < height + 200
    );
    linhasDeFundo.push(linha);
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
        // Curvas suavizadas otimizadas
        let prox = linha.segmentos[i + 1];
        let raio = linha.espessura * 1.5;

        // Vetores normalizados (cache se necessário)
        let dx1 = seg.x2 - seg.x1;
        let dy1 = seg.y2 - seg.y1;
        let len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

        let dx2 = prox.x2 - prox.x1;
        let dy2 = prox.y2 - prox.y1;
        let len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (len1 > 0 && len2 > 0) {
          dx1 /= len1; dy1 /= len1;
          dx2 /= len2; dy2 /= len2;

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

// Função otimizada de deslocamento com cache implícito
function deslocarFundo(x, y) {
  let dx = x - mouseX;
  let dy = y - mouseY;
  let distSq = dx * dx + dy * dy; // Evita sqrt desnecessário
  let maxDistSq = CONFIG.maxDistDeslocamento * CONFIG.maxDistDeslocamento;

  if (distSq < maxDistSq) {
    let d = Math.sqrt(distSq);
    let forca = map(d, 0, CONFIG.maxDistDeslocamento, CONFIG.forcaDeslocamentoFundo, 0);
    return {
      x: x + (dx / d) * forca,
      y: y + (dy / d) * forca
    };
  }
  return { x, y };
}

function desenharLinhaPrincipal() {
  // Cache de valores calculados
  let centroX = width * 0.5;
  let inicioY = height * 0.12;
  let espacoY = height * 0.16;
  let boxW = width * 0.4;
  let boxH = height * 0.12;
  let raioBox = boxH * 0.33;

  // Pré-calcular posições dos eventos
  let posicoes = eventos.map((evento, i) => {
    let baseX = centroX + evento.offsetX;
    let baseY = inicioY + i * espacoY;
    return deslocar(baseX, baseY);
  });

  // Linha inicial
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(posicoes[0].x, -boxH * 2.5, posicoes[0].x, posicoes[0].y - boxH * 0.5);

  // Desenhar conexões e eventos em um loop
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

    // Caixas dos eventos
    fill(CORES.verde);
    stroke(CORES.roxo);
    strokeWeight(CONFIG.espessuraLinhaPrincipal);
    rect(pos.x, pos.y, boxW, boxH, raioBox);

    // Texto otimizado
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    
    textStyle(BOLD);
    textSize(boxH * 0.3);
    text(evento.titulo, pos.x - boxW * 0.1, pos.y - boxH * 0.15);
    
    //textStyle(NORMAL);
    
    textSize(boxH * 0.45);
    fill(CORES.roxo);
    
   // textAlign(LEFT, CENTER);
    text(evento.data, pos.x+boxW * 0.25, pos.y + boxH * 0.25);
  }

  // Linha final
  let ultimaPos = posicoes[posicoes.length - 1];
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(ultimaPos.x, ultimaPos.y + boxH * 0.5, ultimaPos.x, height + boxH);
}

function deslocar(x, y) {
  let dx = x - mouseX;
  let dy = y - mouseY;
  let distSq = dx * dx + dy * dy;
  let maxDistSq = CONFIG.maxDistDeslocamento * CONFIG.maxDistDeslocamento;

  if (distSq < maxDistSq) {
    let d = Math.sqrt(distSq);
    let forca = map(d, 0, CONFIG.maxDistDeslocamento, CONFIG.forcaDeslocamentoPrincipal, 0);
    return {
      x: x + (dx / d) * forca,
      y: y + (dy / d) * forca
    };
  }
  return { x, y };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight * 0.6);
  gerarLinhasDeFundo();
}
