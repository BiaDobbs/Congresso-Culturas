let linhasDeFundo = [];
let eventos = [
  { titulo: "Avaliação das propostas", data: " até 24.08", offsetX: 0 },
  { titulo: "Publicação dos resultados", data: "28.08", offsetX: -190 },
  { titulo: "Programação provisória", data: "10.09", offsetX: 130 },
  { titulo: "Período de inscrições", data: "10.09 - 31.10", offsetX: -150 },
  { titulo: "Envio dos textos completos", data: "até 31.10", offsetX: 60 },
  { titulo: "Divulgação do programa final", data: "05.11", offsetX: 0 },
];



const CORES = {
  verde: "#46b2a3",
  roxo: "#6b4ca3",
  linhas: ["#ffc600", "#ff8ace", "#4cc1ec"]
};

let CONFIG = {
  linhasHorizontais: 15,
  linhasVerticais: 10,
  maxDistDeslocamento: 200,
  forcaDeslocamentoFundo: 6,
  forcaDeslocamentoPrincipal: 15,
  espessuraLinhaFundo: 4,
  espessuraLinhaPrincipal: 5
};

// Variáveis para responsividade
let isMobile = false;
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

  // Detectar se é mobile
  detectarDispositivo();
  
  // Configurar canvas responsivo
  configurarCanvasResponsivo();
  
  let canvas = createCanvas(windowWidth, windowHeight * 0.6);
  canvas.elt.id = "p5-canvas";
  canvas.parent("canvas-wrapper");

  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  
  // Configurar eventos de touch para mobile
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
             
  // Ajustar configurações para mobile
  if (isMobile) {
    CONFIG.linhasHorizontais = 8;
    CONFIG.linhasVerticais = 6;
    CONFIG.maxDistDeslocamento = 150;
    CONFIG.forcaDeslocamentoFundo = 4;
    CONFIG.forcaDeslocamentoPrincipal = 12;
    CONFIG.espessuraLinhaFundo = 3;
    CONFIG.espessuraLinhaPrincipal = 4;
  }
}

function configurarCanvasResponsivo() {
  // Ajustar altura do canvas baseado no dispositivo
  let alturaCanvas = isMobile ? windowHeight * 0.8 : windowHeight * 0.6;
  
  // Garantir altura mínima
  alturaCanvas = Math.max(alturaCanvas, 400);
  
  return alturaCanvas;
}

function handleTouch(e) {
  e.preventDefault();
  if (e.touches.length > 0) {
    let rect = e.target.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
    touchY = e.touches[0].clientY - rect.top;
    
    // Atualizar mouseX e mouseY para compatibilidade
    mouseX = touchX;
    mouseY = touchY;
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
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
  
  function criarLinha(startX, startY, direcoes, condicaoParada) {
    let linha = {
      segmentos: [],
      cor: color(CORES.linhas[linhasDeFundo.length % CORES.linhas.length]),
      espessura: CONFIG.espessuraLinhaFundo,
      pontos: []
    };

    let x = startX, y = startY;
    let direcaoAtual = random(direcoes);

    while (condicaoParada(x, y)) {
      let len = isMobile ? random(60, 120) : random(80, 160);
      let inicioX = x, inicioY = y;

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
        let prox = linha.segmentos[i + 1];
        let raio = linha.espessura * 1.5;

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

function deslocarFundo(x, y) {
  let dx = x - mouseX;
  let dy = y - mouseY;
  let distSq = dx * dx + dy * dy;
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
  // Dimensões responsivas
  let centroX = width * 0.5;
  let inicioY = isMobile ? height * 0.08 : height * 0.14;
  let espacoY = isMobile ? height * 0.12 : height * 0.15;
  
  // Caixas responsivas
  let boxW = isMobile ? Math.min(width * 0.85, 300) : width * 0.27;
  let boxH = isMobile ? Math.max(height * 0.08, 60) : height * 0.09;
  let raioBox = boxH * 0.33;

  // Ajustar offsets para mobile
  let eventosResponsivos = eventos.map(evento => ({
    ...evento,
    offsetX: isMobile ? evento.offsetX * 0.3 : evento.offsetX
  }));

  // Pré-calcular posições dos eventos
  let posicoes = eventosResponsivos.map((evento, i) => {
    let baseX = centroX + evento.offsetX;
    let baseY = inicioY + i * espacoY;
    return deslocar(baseX, baseY);
  });

  // Linha inicial
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(posicoes[0].x, -boxH * 2.5, posicoes[0].x, posicoes[0].y - boxH * 0.5);

  // Desenhar conexões e eventos
  for (let i = 0; i < eventosResponsivos.length; i++) {
    let pos = posicoes[i];
    let evento = eventosResponsivos[i];

    // Linhas de conexão
    if (i < eventosResponsivos.length - 1) {
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

    // Sistema de texto responsivo
    desenharTextoResponsivo(evento, pos.x, pos.y, boxW, boxH);
  }

  // Linha final
  let ultimaPos = posicoes[posicoes.length - 1];
  stroke(CORES.roxo);
  strokeWeight(CONFIG.espessuraLinhaPrincipal);
  line(ultimaPos.x, ultimaPos.y + boxH * 0.5, ultimaPos.x, height + boxH);
}

function desenharTextoResponsivo(evento, x, y, boxW, boxH) {
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  
  // Margens responsivas
  let margemH = isMobile ? boxW * 0.12 : boxW * 0.15;
  let margemV = isMobile ? boxH * 0.12 : boxH * 0.15;
  let larguraTexto = boxW - margemH * 2;
  
  // Tamanhos responsivos
  let fatorMobile = isMobile ? 1.2 : 1;
  let tamanhoMinData = Math.max(isMobile ? 14 : 12, boxH * 0.25) * fatorMobile;
  let tamanhoMaxData = Math.min(isMobile ? 22 : 28, boxH * 0.45) * fatorMobile;
  let tamanhoMinTitulo = Math.max(isMobile ? 12 : 11, boxH * 0.2) * fatorMobile;
  let tamanhoMaxTitulo = Math.min(isMobile ? 18 : 24, boxH * 0.35) * fatorMobile;
  
  // Calcular tamanhos
  let tamanhoTitulo = calcularTamanhoTextoMelhorado(
    evento.titulo, larguraTexto, tamanhoMinTitulo, tamanhoMaxTitulo
  );
  
  let tamanhoData = calcularTamanhoTextoMelhorado(
    evento.data, larguraTexto, tamanhoMinData, tamanhoMaxData
  );
  
  // Garantir proporção mínima
  let proporcaoMinima = isMobile ? 0.75 : 0.7;
  tamanhoData = Math.max(tamanhoData, tamanhoTitulo * proporcaoMinima);
  
  if (tamanhoData > tamanhoMaxData) {
    tamanhoData = tamanhoMaxData;
    tamanhoTitulo = Math.min(tamanhoTitulo, tamanhoData / proporcaoMinima);
  }
  
  // Posições verticais
  let espacoEntreTitulos = isMobile ? boxH * 0.08 : boxH * 0.10;
  let yTitulo = y - espacoEntreTitulos / 2;
  let yData = y + espacoEntreTitulos / 2;
  
  // Desenhar título
  textStyle(BOLD);
  textSize(tamanhoTitulo);
  
  let linhasTitulo = quebrarTextoMelhorado(evento.titulo, larguraTexto, tamanhoTitulo);
  
  if (linhasTitulo.length > 1) {
    let alturaLinha = tamanhoTitulo * 1.1;
    let alturaTotal = linhasTitulo.length * alturaLinha;
    let yInicio = yTitulo - alturaTotal / 2 + alturaLinha / 2;
    
    for (let i = 0; i < linhasTitulo.length; i++) {
      text(linhasTitulo[i], (isMobile ? x-boxW*0.1 : x-boxW*0.25), yInicio + i * alturaLinha);
    }
    
    if (linhasTitulo.length > 1) {
      yData = yInicio + alturaTotal + espacoEntreTitulos;
    }
  } else {
    text(evento.titulo, (isMobile ? x-boxW*0.1 : x-boxW*0.25), yTitulo);
  }
  
  // Desenhar data
  fill(CORES.roxo);
  textSize(tamanhoData);
  text(evento.data, (isMobile ? x+boxW*0.1 : x+boxW*0.25), yData);
}

function calcularTamanhoTextoMelhorado(texto, larguraMax, tamanhoMin, tamanhoMax) {
  for (let tamanho = tamanhoMax; tamanho >= tamanhoMin; tamanho -= 0.5) {
    textSize(tamanho);
    if (textWidth(texto) <= larguraMax) {
      return tamanho;
    }
  }
  return tamanhoMin;
}

function quebrarTextoMelhorado(texto, larguraMax, tamanhoTexto) {
  textSize(tamanhoTexto);
  
  if (textWidth(texto) <= larguraMax) {
    return [texto];
  }
  
  let palavras = texto.split(' ');
  let linhas = [];
  let linhaAtual = '';
  
  for (let palavra of palavras) {
    let testeLinh = linhaAtual + (linhaAtual ? ' ' : '') + palavra;
    
    if (textWidth(testeLinh) <= larguraMax) {
      linhaAtual = testeLinh;
    } else {
      if (linhaAtual) {
        linhas.push(linhaAtual);
        linhaAtual = palavra;
      } else {
        linhas.push(palavra);
        linhaAtual = '';
      }
    }
    
    if (linhas.length >= 2) {
      break;
    }
  }
  
  if (linhaAtual && linhas.length < 2) {
    linhas.push(linhaAtual);
  }
  
  return linhas;
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
  // Redetectar dispositivo em caso de rotação
  detectarDispositivo();
  
  let alturaCanvas = configurarCanvasResponsivo();
  resizeCanvas(windowWidth, alturaCanvas);
  gerarLinhasDeFundo();
}
