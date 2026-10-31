/*
 * FUENTE ÚNICA — Súper Festival de Tortas · página da VSL
 *
 * Tudo que muda entre as versões de preço fica aqui. O resto da página lê daqui.
 * No ar em tortas.sulimiro.com: cada versão tem URL própria, /v1, /v2, /v3 e /v4 (campo "caminho"; as rotas estão no _redirects).
 * Abrindo o arquivo no computador, use ?v=37 (ou ?v=v1).
 * Ofertas e players vieram de "Scripts VTurb e links de oferta hotmart.txt" (25/09/2026).
 */
window.SFT_CONFIG = {
  // Versão usada quando a URL não diz qual é (ex.: a raiz do domínio).
  versaoPadrao: "47",

  // "fechada": só o vídeo aparece; o resto da página e o botão surgem no pitch (recomendado para começar).
  // "aberta": a página inteira aparece desde o início. Uma versão pode ter o próprio "modo" (ver v4).
  modo: "fechada",

  // Checkout Hotmart (produto Súper Festival de Tortas). Os parâmetros utm_* da página
  // são repassados ao checkout; utm_source vira src e utm_campaign vira sck, como na página atual.
  checkoutBase: "https://pay.hotmart.com/C105903085V",
  // Modo do checkout (parâmetro checkoutMode do Hotmart): "10" abre o checkout personalizado, com imagem.
  // Uma versão pode ter o próprio; "" usa o checkout nativo do Hotmart, sem o parâmetro (ver v1).
  checkoutMode: "10",

  // Conta do vturb (aparece na URL dos scripts do embed).
  vturbConta: "aaf7e55a-703a-4e4e-8fc1-686db84b85f0",

  versoes: {
    "37": {
      caminho: "v1",              // URL: tortas.sulimiro.com/v1
      preco: "37",
      ancora: "97",               // o que a VSL fala ("en lugar de 97")
      oferta: "g9sytb4b",         // código "off" da oferta de US$ 37 no Hotmart
      checkoutMode: "",           // checkout nativo do Hotmart, sem a imagem do personalizado (Gabriel, 28/09)
      video: {
        tipo: "vturb",            // "vturb" | "panda" | "youtube" | "mp4" | "nenhum"
        id: "6aac00a97d9f1e22a867a972",   // vturb: id do player (sem o "vid-")
        hls: "6aac009ca3dd003c8f246764",  // vturb: id do vídeo no main.m3u8 (só para pré-carregar)
        revelarEm: 840            // segundos: 14:00, quando a Sú fala o preço (ver LEIA-ME)
      }
    },
    "47": {
      caminho: "v2",
      preco: "47",
      ancora: "97",
      oferta: "gr2rnwq6",
      video: { tipo: "vturb", id: "6aac011dd1a5582ed949fca5", hls: "6aac011036f51977b8730393", revelarEm: 840 }
    },
    "57": {
      caminho: "v3",
      preco: "57",
      ancora: "97",
      oferta: "x2g2rf0h",
      video: { tipo: "vturb", id: "6aac012beb06d96c9271d1e2", hls: "6aac011e1501c42e32c43daa", revelarEm: 840 }
    },
    // v4: US$ 57 com a página inteira aberta desde o início. Usa o player da v3 (o vídeo fala 57),
    // mas tem oferta própria no Hotmart ("oferta 57 V4"), então as vendas da v3 e da v4 já se separam pela oferta.
    "57-aberta": {
      caminho: "v4",
      modo: "aberta",
      preco: "57",
      ancora: "97",
      oferta: "08mpg180",
      video: { tipo: "vturb", id: "6aac012beb06d96c9271d1e2", hls: "6aac011e1501c42e32c43daa", revelarEm: 840 }
    }
  },

  // Rastreamento: quem faz é a tag do TSL/Sinal no <head> do index.html (pixel da Meta + CAPI,
  // GA4 G-DHRPS84PYE, Clarity e marcos 25/50/75/100% do vídeo). Por isso GTM e Clarity ficam vazios:
  // o GTM-NG77ZXCP da página quente carrega o MESMO pixel da Meta e dobraria o PageView.
  // O Sinal só dispara o pixel em sulimiro.com e subdomínios: publicar a página num deles.
  gtmId: "",
  clarityId: ""
};

// Qual versão esta URL pede (/v1, /v2, /v3 ou ?v=). Usado no <head> para pré-carregar o player certo.
window.SFT_VERSAO = (function (c) {
  var porCaminho = {};
  for (var k in c.versoes) porCaminho[c.versoes[k].caminho] = k;
  var m = location.pathname.match(/\/(v\d+)(?:\/|$|\.html)/);
  if (m && porCaminho[m[1]]) return porCaminho[m[1]];
  var v = new URLSearchParams(location.search).get("v");
  if (v && porCaminho[v]) v = porCaminho[v];
  return v && c.versoes[v] ? v : c.versaoPadrao;
})(window.SFT_CONFIG);
