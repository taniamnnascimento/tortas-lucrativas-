/* Súper Festival de Tortas · página da VSL
 * 1. descobre a versão (URL /v1, /v2, /v3 ou ?v=)
 * 2. preenche preço, âncora e links de checkout (com UTMs)
 * 3. liga os componentes (carrosséis, abas de país, manifesto, barras, payback pelo preço da versão)
 * 4. monta o player e libera botão + página no pitch (ou desde o início, no modo "aberta")
 */
(function () {
  "use strict";
  var CFG = window.SFT_CONFIG;
  var params = new URLSearchParams(location.search);
  var body = document.body;

  /* ---------- versão (calculada em js/config.js, que carrega no <head>) ---------- */
  var versao = window.SFT_VERSAO || CFG.versaoPadrao;
  var V = CFG.versoes[versao];
  body.setAttribute("data-versao", versao);

  /* ---------- rastreamento ---------- */
  window.dataLayer = window.dataLayer || [];
  function evento(nome, extra) {
    var e = { event: nome, sft_versao: versao };
    if (extra) for (var k in extra) e[k] = extra[k];
    window.dataLayer.push(e);
  }
  // arquivo local ou localhost: não carrega GTM/Clarity (testes não entram nos relatórios)
  var local = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (CFG.gtmId && !local) {
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s);
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", CFG.gtmId);
  }
  if (CFG.clarityId && !local) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CFG.clarityId);
  }
  evento("vsl_pagina", {});

  /* ---------- preço e âncora ---------- */
  document.querySelectorAll("[data-preco]").forEach(function (el) { el.textContent = V.preco; });
  document.querySelectorAll("[data-ancora]").forEach(function (el) { el.textContent = V.ancora; });
  // porções para recuperar o investimento, ao preço médio das alunas (US$ 4,50)
  document.querySelectorAll("[data-porcoes]").forEach(function (el) { el.textContent = Math.ceil(Number(V.preco) / 4.5); });

  /* ---------- checkout com UTMs (mesma regra da página atual) ---------- */
  function urlCheckout() {
    var url = new URL(CFG.checkoutBase);
    url.searchParams.set("off", V.oferta);
    // checkoutMode por versão; vazio = checkout nativo do Hotmart (sem o parâmetro)
    var modoCheckout = V.checkoutMode !== undefined ? V.checkoutMode : CFG.checkoutMode;
    if (modoCheckout) url.searchParams.set("checkoutMode", modoCheckout);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
      var val = params.get(k);
      if (val) url.searchParams.set(k, val);
    });
    if (params.get("utm_source")) url.searchParams.set("src", params.get("utm_source"));
    if (params.get("utm_campaign")) url.searchParams.set("sck", params.get("utm_campaign"));
    return url.toString();
  }
  var ofertaPendente = !V.oferta || /^PREENCHER/.test(V.oferta);
  var href = ofertaPendente ? null : urlCheckout();
  document.querySelectorAll("a[data-checkout]").forEach(function (a) {
    if (href) a.href = href; // sem oferta configurada, o botão só rola até a caixa de oferta
    a.addEventListener("click", function () {
      evento("clique_checkout", { sft_local: a.getAttribute("data-checkout") });
    });
  });
  if (ofertaPendente) {
    console.warn("[SFT] Oferta da versão " + versao + " não configurada em js/config.js");
    body.classList.add("oferta-pendente");
  }

  /* ---------- rolar até a oferta ---------- */
  document.querySelectorAll("[data-ir-oferta]").forEach(function (b) {
    b.addEventListener("click", function (ev) {
      ev.preventDefault();
      var alvo = document.getElementById("oferta");
      if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------- componentes: carrosséis, abas de país, manifesto, barras e payback ---------- */
  // setas dos carrosséis: rolam quase uma "tela" do trilho (no celular, o dedo já rola)
  document.querySelectorAll("[data-carrossel]").forEach(function (c) {
    var trilho = c.querySelector(".carrossel__trilho");
    c.querySelectorAll(".carrossel__seta").forEach(function (b) {
      b.addEventListener("click", function () {
        trilho.scrollBy({ left: Number(b.getAttribute("data-dir")) * trilho.clientWidth * 0.85, behavior: "smooth" });
      });
    });
  });

  // abas de país: filtram os cards das alunas ("¿funciona en mi país?")
  var abas = document.querySelectorAll(".aba[data-filtro]");
  abas.forEach(function (aba) {
    aba.addEventListener("click", function () {
      var f = aba.getAttribute("data-filtro");
      abas.forEach(function (a) {
        var on = a === aba;
        a.classList.toggle("ativa", on);
        a.setAttribute("aria-pressed", on ? "true" : "false");
      });
      document.querySelectorAll("[data-casos] .card-caso").forEach(function (card) {
        card.hidden = !(f === "todas" || card.getAttribute("data-pais") === f);
      });
      var trilho = document.querySelector("[data-casos]");
      if (trilho) trilho.scrollLeft = 0;
      evento("filtro_pais", { sft_pais: f });
    });
  });

  // manifesto: cada palavra vira um <span> que acende em sequência quando o bloco aparece
  var manifesto = document.querySelector("[data-manifesto]");
  if (manifesto) {
    var n = 0;
    (function quebrar(no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (filho) {
        if (filho.nodeType === 1) return quebrar(filho);
        if (filho.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        filho.textContent.split(/(\s+)/).forEach(function (parte) {
          if (!parte) return;
          if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(parte)); return; }
          var s = document.createElement("span");
          s.className = "p";
          s.style.setProperty("--i", n++);
          s.textContent = parte;
          frag.appendChild(s);
        });
        no.replaceChild(frag, filho);
      });
    })(manifesto);
  }

  // barras da pesquisa: largura proporcional à maior resposta (32%)
  document.querySelectorAll("[data-barras] .barra").forEach(function (b) {
    b.style.setProperty("--v", (Number(b.getAttribute("data-valor")) / 32 * 100) + "%");
  });

  // payback: ganancia de cada alumna × valor do curso desta versão
  var preco = Number(V.preco);
  var lucros = document.querySelectorAll("[data-lucros] .lucro");
  var maior = 0, acima = 0;
  lucros.forEach(function (l) { maior = Math.max(maior, Number(l.getAttribute("data-ganancia"))); });
  lucros.forEach(function (l) {
    var g = Number(l.getAttribute("data-ganancia"));
    l.style.setProperty("--v", (g / maior * 100) + "%");
    if (g > preco) { acima++; l.classList.add("acima"); }
  });
  var caixaLucros = document.querySelector("[data-lucros]");
  if (caixaLucros && maior) caixaLucros.style.setProperty("--preco-pct", Math.min(100, preco / maior * 100) + "%");
  document.querySelectorAll("[data-payback-n]").forEach(function (el) { el.textContent = acima; });

  // barra fixa do celular: some enquanto o vídeo está na tela (não cobre o player)
  var secVideo = document.querySelector(".video");
  if (secVideo && "IntersectionObserver" in window) {
    new IntersectionObserver(function (itens) {
      body.classList.toggle("video-na-tela", itens[0].isIntersecting);
    }, { threshold: 0.15 }).observe(secVideo);
  }

  // animações quando o bloco entra na tela (sem IntersectionObserver, já aparece pronto)
  var animados = document.querySelectorAll("[data-manifesto], [data-barras], [data-lucros]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (it.isIntersecting) { it.target.classList.add("ativo"); io.unobserve(it.target); }
      });
    }, { threshold: 0.3 });
    animados.forEach(function (el) { io.observe(el); });
  } else {
    animados.forEach(function (el) { el.classList.add("ativo"); });
  }

  /* ---------- liberar a página no pitch ---------- */
  var CHAVE = "sft_vsl_revelado_" + versao;
  var revelado = false;
  function revelar(origem) {
    if (revelado) return;
    revelado = true;
    body.classList.add("revelado");
    try { localStorage.setItem(CHAVE, "1"); } catch (e) {}
    evento("vsl_revelado", { sft_origem: origem });
  }
  var jaViu = false;
  try { jaViu = localStorage.getItem(CHAVE) === "1"; } catch (e) {}
  var modo = V.modo || CFG.modo; // a versão pode ter o próprio modo (ex.: v4 aberta)
  if (modo === "aberta") revelar("modo_aberta");
  else if (params.get("revelar") === "1") revelar("parametro");
  else if (jaViu) revelar("retorno");

  var alvoSeg = Number(params.get("pitch")) || V.video.revelarEm;
  function checarTempo(seg) { if (seg >= alvoSeg) revelar("pitch"); }

  /* ---------- player ---------- */
  var caixa = document.getElementById("player");
  var tipo = V.video.tipo;

  function carregarScript(src, cb) {
    var s = document.createElement("script");
    s.src = src; s.async = true; if (cb) s.onload = cb;
    document.head.appendChild(s);
  }

  if (tipo === "vturb" && V.video.id && CFG.vturbConta) {
    // mesmo embed que o vturb entrega (com o placeholder 9:16 para não "pular" a página)
    caixa.innerHTML =
      '<vturb-smartplayer id="vid-' + V.video.id + '" style="display:block;margin:0 auto;width:100%;max-width:400px;">' +
      '<div class="vturb-player-placeholder" style="position:relative;width:100%;padding:177.77777777777777% 0 0;z-index:0;background-color:black;"></div>' +
      "</vturb-smartplayer>";
    carregarScript("https://scripts.converteai.net/" + CFG.vturbConta + "/players/" + V.video.id + "/v4/player.js");
    var p = caixa.querySelector("vturb-smartplayer");
    // displayHiddenElements(segundos, seletores, opções) é o "delay" do vturb v4: no segundo marcado ele
    // mostra os seletores e chama o callback; com persist, quem volta já recebe tudo liberado
    p.addEventListener("player:ready", function () {
      if (typeof p.displayHiddenElements === "function") {
        p.displayHiddenElements(alvoSeg, [".vturb-gatilho"], {
          persist: true,
          callback: function () { revelar("pitch"); }
        });
      }
    });
    // reserva: se o callback não vier, o gatilho visível também libera
    var gatilho = document.querySelector(".vturb-gatilho");
    var vigia = setInterval(function () {
      if (revelado) return clearInterval(vigia);
      if (gatilho && getComputedStyle(gatilho).display !== "none") revelar("pitch");
    }, 1000);
  } else if (tipo === "panda" && V.video.id) {
    caixa.innerHTML = '<div class="proporcao-vertical"><iframe src="' + V.video.id + '" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowfullscreen fetchpriority="high"></iframe></div>';
    window.addEventListener("message", function (e) {
      var d = e.data;
      if (d && d.message === "panda_timeupdate" && typeof d.currentTime === "number") checarTempo(d.currentTime);
    });
  } else if (tipo === "youtube" && V.video.id) {
    caixa.innerHTML = '<div class="proporcao-vertical"><div id="yt"></div></div>';
    window.onYouTubeIframeAPIReady = function () {
      var yt = new YT.Player("yt", {
        videoId: V.video.id,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: { onReady: function () { setInterval(function () { checarTempo(yt.getCurrentTime() || 0); }, 1000); } }
      });
    };
    carregarScript("https://www.youtube.com/iframe_api");
  } else if (tipo === "mp4" && V.video.id) {
    caixa.innerHTML =
      '<div class="proporcao-vertical">' +
      '<video id="vsl" src="' + V.video.id + '" poster="img/poster-vsl.jpg" playsinline muted autoplay preload="metadata"></video>' +
      '<button type="button" class="ativar-som" id="ativar-som"><span class="ativar-som__icone" aria-hidden="true">🔊</span>' +
      '<strong>Tu video ya empezó</strong><span>Toca aquí para escucharlo desde el inicio</span></button>' +
      "</div>";
    var vid = document.getElementById("vsl");
    var btnSom = document.getElementById("ativar-som");
    btnSom.addEventListener("click", function () {
      vid.currentTime = 0; vid.muted = false; vid.controls = true; vid.play();
      btnSom.remove();
      evento("vsl_play_com_som", {});
    });
    // conta o tempo mesmo sem som: a VSL tem legenda embutida e tem gente que assiste muda
    vid.addEventListener("timeupdate", function () { checarTempo(vid.currentTime); });
  } else {
    caixa.innerHTML =
      '<div class="proporcao-vertical player-vazio"><img src="img/poster-vsl.jpg" alt="Sú Limiro en su cocina" width="540" height="960">' +
      "<p>El video se configura en <code>js/config.js</code></p></div>";
  }
  body.setAttribute("data-player", tipo);
})();
