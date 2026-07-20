/* Galton Tahtası — Levha V
   Düşen toplar çivilere çarpıp sola/sağa sapar; kovalarda binom dağılımı birikir.
   Teorik binom eğrisi ve canlı istatistiklerle. Bağımlılık yok. */

const { sqrt, min, max, floor, round, exp, pow, abs, PI } = Math;

/* ---------- kanvas ---------- */
const board = document.getElementById("board");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = window.devicePixelRatio || 1;
  W = board.clientWidth;
  H = max(420, round(window.innerHeight - board.getBoundingClientRect().top - 120));
  canvas.width = round(W * DPR);
  canvas.height = round(H * DPR);
  canvas.style.height = H + "px";
  computeLayout();
}
window.addEventListener("resize", resize);

const PALETTE = ["#2e6f8e", "#3f7d6d", "#7d4bb5", "#c77b3a", "#4f5da8", "#6d8f2f", "#b5432c", "#a8862d"];

/* ---------- durum ---------- */
const state = {
  rows: 12,
  p: 0.5,
  speed: 3,
  showCurve: true,
  streaming: false,
  pending: 0,       // düşmeyi bekleyen top sayısı (Infinity = akış)
};

let bins = [];      // kova sayaçları (rows+1 uzunlukta)
let balls = [];     // animasyondaki toplar
let total = 0;

/* ---------- yerleşim ---------- */
let L = {};
function computeLayout() {
  const n = state.rows;
  const marginX = 30, topY = 46;
  const pegBottom = topY + n * 999; // geçici
  // birim aralık: n+1 kova + kenar boşluğu sığsın
  const u = min((W - 2 * marginX) / (n + 1.5), 46);
  const rowH = min(u * 0.92, (H * 0.44) / max(1, n));
  const cx = W / 2;
  const pegTop = topY;
  const binTop = pegTop + n * rowH + rowH * 0.8;
  L = { n, u, rowH, cx, pegTop, binTop, binMax: H - 16 - binTop };
}

/* ---------- binom olasılıkları ---------- */
function binomPMF(n, p) {
  const pmf = new Array(n + 1);
  pmf[0] = pow(1 - p, n);
  for (let k = 1; k <= n; k++) pmf[k] = pmf[k - 1] * ((n - k + 1) / k) * (p / (1 - p));
  return pmf;
}

/* ---------- toplar ---------- */
function spawnBall() {
  const n = state.rows;
  const decisions = new Array(n);
  let rights = 0;
  for (let i = 0; i < n; i++) {
    const r = Math.random() < state.p ? 1 : 0;
    decisions[i] = r;
    rights += r;
  }
  balls.push({
    decisions,
    bin: rights,
    step: 0,            // hangi sıradayız (0..n)
    t: 0,               // sıra içi ilerleme 0..1
    rights: 0,
    color: PALETTE[rights % PALETTE.length],
  });
}

function ballXY(b) {
  const { u, rowH, cx, pegTop } = L;
  const colBefore = b.rights - b.step / 2;
  const yBefore = pegTop + b.step * rowH;
  if (b.step >= state.rows) {
    // kovaya düşüş
    const x = cx + (b.bin - state.rows / 2) * u;
    return [x, yBefore + b.t * rowH];
  }
  const dCol = (b.decisions[b.step] - 0.5);
  const colNow = colBefore + dCol * b.t;
  // parabolik zıplama hissi
  const bounce = -Math.sin(b.t * PI) * rowH * 0.14;
  return [cx + colNow * u, yBefore + b.t * rowH + bounce];
}

/* ---------- güncelleme ---------- */
function update() {
  // bekleyenlerden yeni top bırak
  let spawnCount = state.speed;
  if (state.streaming) spawnCount = state.speed;
  while (spawnCount-- > 0 && state.pending > 0 && balls.length < 900) {
    spawnBall();
    if (state.pending !== Infinity) state.pending--;
  }

  const dv = 0.055 + state.speed * 0.02;
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    b.t += dv;
    if (b.t >= 1) {
      b.t = 0;
      if (b.step < state.rows) {
        b.rights += b.decisions[b.step];
        b.step++;
      } else {
        // kovaya indi
        bins[b.bin]++;
        total++;
        balls.splice(i, 1);
      }
    }
  }
}

/* ---------- çizim ---------- */
function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const { n, u, rowH, cx, pegTop, binTop, binMax } = L;

  // çiviler
  ctx.fillStyle = "rgba(34, 51, 79, 0.55)";
  for (let r = 0; r < n; r++) {
    for (let k = 0; k <= r; k++) {
      const x = cx + (k - r / 2) * u;
      const y = pegTop + r * rowH;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, 2 * PI);
      ctx.fill();
    }
  }

  // kova ölçeği
  const binW = u * 0.86;
  let maxCount = 1;
  for (const c of bins) if (c > maxCount) maxCount = c;
  // teorik eğri de ölçeğe dahil olsun
  const pmf = binomPMF(n, state.p);
  if (total > 0) {
    for (let k = 0; k <= n; k++) maxCount = max(maxCount, pmf[k] * total);
  }

  // kovalar (histogram)
  for (let k = 0; k <= n; k++) {
    const x = cx + (k - n / 2) * u;
    const h = (bins[k] / maxCount) * binMax;
    if (h > 0.5) {
      ctx.fillStyle = PALETTE[k % PALETTE.length] + "cc";
      ctx.fillRect(x - binW / 2, binTop + binMax - h, binW, h);
      ctx.strokeStyle = "rgba(34,51,79,0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - binW / 2, binTop + binMax - h, binW, h);
    }
  }

  // taban çizgisi
  ctx.strokeStyle = "rgba(34,51,79,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - (n / 2) * u - binW / 2, binTop + binMax + 0.5);
  ctx.lineTo(cx + (n / 2) * u + binW / 2, binTop + binMax + 0.5);
  ctx.stroke();

  // teorik binom eğrisi
  if (state.showCurve && total >= 5) {
    ctx.strokeStyle = "#b5432c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= n; k++) {
      const x = cx + (k - n / 2) * u;
      const y = binTop + binMax - (pmf[k] * total / maxCount) * binMax;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    // eğri noktaları
    ctx.fillStyle = "#b5432c";
    for (let k = 0; k <= n; k++) {
      const x = cx + (k - n / 2) * u;
      const y = binTop + binMax - (pmf[k] * total / maxCount) * binMax;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, 2 * PI);
      ctx.fill();
    }
  }

  // toplar
  for (const b of balls) {
    const [x, y] = ballXY(b);
    ctx.fillStyle = b.color;
    ctx.strokeStyle = "#22334f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * PI);
    ctx.fill();
    ctx.stroke();
  }
}

/* ---------- istatistikler ---------- */
function updateStats() {
  document.getElementById("stTotal").textContent = total.toLocaleString("tr-TR");
  const n = state.rows;
  if (total > 0) {
    let mean = 0;
    for (let k = 0; k <= n; k++) mean += k * bins[k];
    mean /= total;
    let varc = 0;
    for (let k = 0; k <= n; k++) varc += bins[k] * (k - mean) * (k - mean);
    varc /= total;
    document.getElementById("stMean").textContent = mean.toFixed(2);
    document.getElementById("stSd").textContent = sqrt(varc).toFixed(2);
  } else {
    document.getElementById("stMean").textContent = "—";
    document.getElementById("stSd").textContent = "—";
  }
  document.getElementById("stMu").textContent = (n * state.p).toFixed(2);
  document.getElementById("stSigma").textContent = sqrt(n * state.p * (1 - state.p)).toFixed(2);
}

/* ---------- döngü ---------- */
function loop() {
  update();
  draw();
  updateStats();
  requestAnimationFrame(loop);
}

/* ---------- sıfırlama ---------- */
function resetBoard() {
  bins = new Array(state.rows + 1).fill(0);
  balls = [];
  total = 0;
  state.pending = 0;
  state.streaming = false;
  document.getElementById("streamBtn").classList.remove("active");
}

/* ---------- kontroller ---------- */
document.querySelectorAll("[data-drop]").forEach((b) =>
  b.addEventListener("click", () => { state.pending += +b.dataset.drop; })
);
const streamBtn = document.getElementById("streamBtn");
streamBtn.addEventListener("click", () => {
  state.streaming = !state.streaming;
  streamBtn.classList.toggle("active", state.streaming);
  state.pending = state.streaming ? Infinity : 0;
});
document.getElementById("resetBtn").addEventListener("click", resetBoard);

const rowSlider = document.getElementById("rowSlider");
rowSlider.addEventListener("input", () => {
  state.rows = +rowSlider.value;
  document.getElementById("rowVal").textContent = state.rows;
  computeLayout();
  resetBoard();
});
const probSlider = document.getElementById("probSlider");
probSlider.addEventListener("input", () => {
  state.p = +probSlider.value / 100;
  document.getElementById("probVal").textContent = state.p.toFixed(2).replace(".", ",");
  resetBoard();
});
const speedSlider = document.getElementById("speedSlider");
speedSlider.addEventListener("input", () => {
  state.speed = +speedSlider.value;
  document.getElementById("speedVal").textContent = "×" + state.speed;
});
document.getElementById("curveChk").addEventListener("change", (ev) => (state.showCurve = ev.target.checked));

/* ---------- sayfa geçişi (levha sekmeleri) ---------- */
document.addEventListener("click", (ev) => {
  const a = ev.target.closest("a.page-link");
  if (!a || !a.getAttribute("href") || a.target === "_blank") return;
  ev.preventDefault();
  document.body.classList.add("leaving");
  setTimeout(() => (location.href = a.href), 240);
});

/* ---------- başlangıç ---------- */
resize();
resetBoard();
state.pending = 50;
loop();
