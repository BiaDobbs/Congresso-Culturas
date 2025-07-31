    let linhasDeFundo = [];
    let eventos = [
      { titulo: "Avaliação das propostas", data: "31.07 - 24.08", offsetX: 0 },
      { titulo: "Publicação dos resultados", data: "28.08", offsetX: -190 },
      { titulo: "Programação provisória", data: "10.09", offsetX: 130 },
      { titulo: "Inscrições", data: "10.09 - 31.10", offsetX: -150 },
      { titulo: "Envio dos textos completos", data: "até 31.10", offsetX: 60 },
      { titulo: "Divulgação do programa final", data: "05.115", offsetX: -0 },

    ];

    let colors = ['#ffc600', '#ff8ace', '#4cc1ec'];
    
    function setup() {
      createCanvas(windowWidth, windowHeight-100);
      textAlign(CENTER, CENTER);
      textSize(14);
      rectMode(CENTER);
      gerarLinhasDeFundo();
    }

    function draw() {
      background(255);
      desenharFundo();
      desenharLinhaPrincipal();
    }

    function gerarLinhasDeFundo() {
      linhasDeFundo = [];
      for (let i = 0; i < 25; i++) {
        let linha = {
          segmentos: [],
          cor: color(colors[i % colors.length]),
          espessura: 4
        };

        let x = random(-150, width * 0.2);
        let y = random(height * 0.1, height * 0.9);
        let direcoes = ['horizontal', 'vertical', 'diagonal-up', 'diagonal-down'];
        let direcaoAtual = random(direcoes);

        while (x < width + 150 && y > 0 && y < height) {
          let len = random(80, 160);
          let inicioX = x;
          let inicioY = y;

          if (direcaoAtual === 'horizontal') {
            x += len;
          } else if (direcaoAtual === 'vertical') {
            y += random() > 0.5 ? len : -len;
            y = constrain(y, 50, height - 50);
          } else if (direcaoAtual === 'diagonal-up') {
            x += len * 0.7;
            y -= len * 0.7;
            y = constrain(y, 50, height - 50);
          } else if (direcaoAtual === 'diagonal-down') {
            x += len * 0.7;
            y += len * 0.7;
            y = constrain(y, 50, height - 50);
          }

          linha.segmentos.push({ x1: inicioX, y1: inicioY, x2: x, y2: y });

          if (random() < 0.3) {
            direcaoAtual = random(direcoes);
          }
        }

        linhasDeFundo.push(linha);
      }
    }

    function desenharFundo() {
      strokeCap(ROUND);
      strokeJoin(ROUND);
      noFill();

      for (let linha of linhasDeFundo) {
        stroke(linha.cor);
        strokeWeight(linha.espessura);

        if (linha.segmentos.length === 0) continue;

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
            let len1 = sqrt(dx1 * dx1 + dy1 * dy1);

            let dx2 = prox.x2 - prox.x1;
            let dy2 = prox.y2 - prox.y1;
            let len2 = sqrt(dx2 * dx2 + dy2 * dy2);

            dx1 /= len1; dy1 /= len1;
            dx2 /= len2; dy2 /= len2;

            let distIni = min(raio, len1 * 0.3);
            let distFim = min(raio, len2 * 0.3);

            let curvaIni = deslocarFundo(seg.x2 - dx1 * distIni, seg.y2 - dy1 * distIni);
            let controle = deslocarFundo(seg.x2, seg.y2);
            let curvaFim = deslocarFundo(seg.x2 + dx2 * distFim, seg.y2 + dy2 * distFim);

            vertex(curvaIni.x, curvaIni.y);
            quadraticVertex(controle.x, controle.y, curvaFim.x, curvaFim.y);
          }
        }

        endShape();
      }
    }

    function deslocarFundo(x, y) {
      let maxDist = 200;
      let dx = x - mouseX;
      let dy = y - mouseY;
      let d = dist(x, y, mouseX, mouseY);

      if (d < maxDist) {
        let forca = map(d, 0, maxDist, 6, 0);
        let ang = atan2(dy, dx);
        return {
          x: x + cos(ang) * forca,
          y: y + sin(ang) * forca
        };
      }
      return { x, y };
    }

    function desenharLinhaPrincipal() {
      let centroX = width / 2;
      let inicioY = 100;
      let espacoY = 80;
      let boxW = 220;
      let boxH = 60;

      let verde = '#46b2a3';
      let roxo = '#6b4ca3';

      // Linha vindo de cima antes do primeiro evento
      let primeiroEvento = eventos[0];
      let baseX = centroX + primeiroEvento.offsetX;
      let baseY = inicioY;
      let posPrimeiro = deslocar(baseX, baseY);
      let startY = -150; // fora da tela topo

      stroke(roxo);
      strokeWeight(5);
      line(posPrimeiro.x, startY, posPrimeiro.x, posPrimeiro.y - boxH / 2);

      for (let i = 0; i < eventos.length; i++) {
        let evento = eventos[i];
        let baseX = centroX + evento.offsetX;
        let baseY = inicioY + i * espacoY;

        let pos = deslocar(baseX, baseY);

        // Linhas entre eventos
        if (i < eventos.length - 1) {
          let proximo = eventos[i + 1];
          let nextBaseX = centroX + proximo.offsetX;
          let nextBaseY = inicioY + (i + 1) * espacoY;

          let nextPos = deslocar(nextBaseX, nextBaseY);
          let midY = (pos.y + nextPos.y) / 2;

          stroke(roxo);
          strokeWeight(5);
          line(pos.x, pos.y + boxH / 2, pos.x, midY);
          line(pos.x, midY, nextPos.x, midY);
          line(nextPos.x, midY, nextPos.x, nextPos.y - boxH / 2);
        }

        // Fundo verde e borda roxa para eventos pares, invertido para ímpares
        //let fundoCor = (i % 2 === 0) ? verde : roxo;
        //let bordaCor = (i % 2 === 0) ? roxo : verde;
        
        fundoCor = verde;
        bordaCor = roxo;

        fill(fundoCor);
        stroke(bordaCor);
        strokeWeight(5);
        rect(pos.x, pos.y, boxW, boxH, 20);

        
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textWrap(WORD);

        textStyle(BOLD);
        text(evento.titulo, pos.x, pos.y - 10);

        textStyle(NORMAL);
        text(evento.data, pos.x, pos.y + 12);
      }

      // Linha saindo para baixo depois do último evento
      let ultimoEvento = eventos[eventos.length - 1];
      let ultimoX = centroX + ultimoEvento.offsetX;
      let ultimoY = inicioY + (eventos.length - 1) * espacoY;
      let posUltimo = deslocar(ultimoX, ultimoY);
      stroke(roxo);
      strokeWeight(5);
      line(posUltimo.x, posUltimo.y + boxH / 2, posUltimo.x, height + 50);
    }

    function deslocar(x, y) {
      let maxDist = 200;
      let dx = x - mouseX;
      let dy = y - mouseY;
      let d = dist(x, y, mouseX, mouseY);

      if (d < maxDist) {
        let forca = map(d, 0, maxDist, 15, 0);
        let ang = atan2(dy, dx);
        return {
          x: x + cos(ang) * forca,
          y: y + sin(ang) * forca
        };
      }
      return { x, y };
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      gerarLinhasDeFundo();
    }
