const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");
const greetingEl = document.getElementById("greeting");
const wrapper = document.querySelector(".canvas-wrapper");

// Core knobs for the binary-tree generator and animation pacing.
const CONFIG = {
  maxDepth: 9,
  baseLength: 1,
  lengthDecay: 0.72,
  baseAngle: 32,
  angleJitter: 16,
  duration: 1100,
  durationDecay: 0.83,
  levelDelay: 380,
  baseThickness: 11,
  thicknessDecay: 0.72,
  seed: 20260213,
};

// Animation bookkeeping shared across the render loop.
let animationFrame = null;
let branches = [];
let preparedBranches = [];
let bounds = null;
let layout = null;
let totalDuration = 0;
let animationStart = null;
let greetingShown = false;

const resizeObserver = new ResizeObserver(() => {
  prepareCanvas();
  restartAnimation();
});

init();

function init() {
  // Precompute the deterministic tree structure, then wire up resize handling.
  branches = generateTree();
  resizeObserver.observe(wrapper);
  prepareCanvas();
  restartAnimation();
  window.addEventListener("resize", debounce(handleResize, 120));
}

function handleResize() {
  prepareCanvas();
  restartAnimation();
}

function restartAnimation() {
  // Reset timing and hide the greeting so the sequence can replay cleanly.
  cancelAnimationFrame(animationFrame);
  greetingEl.classList.remove("is-visible");
  greetingEl.setAttribute("aria-hidden", "true");
  greetingShown = false;
  animationStart = null;
  animationFrame = requestAnimationFrame(step);
}

function prepareCanvas() {
  // Resize the canvas to the observer-reported wrapper bounds and
  // recompute the projection that keeps the tree centered and visible.
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = wrapper.getBoundingClientRect();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  layout = computeLayout(width, height);
  preparedBranches = prepareBranches(layout);
  totalDuration = preparedBranches.reduce(
    (acc, branch) => Math.max(acc, branch.startTime + branch.duration),
    0
  );
  positionGreeting();
}

function step(timestamp) {
  if (!animationStart) animationStart = timestamp;
  const elapsed = timestamp - animationStart;

  // Clear using an identity transform so device-pixel ratio is respected.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  ctx.lineCap = "round";

  let finished = true;
  for (const branch of preparedBranches) {
    const progress = progressFor(branch, elapsed);
    if (progress <= 0) {
      finished = false;
      continue;
    }

    drawBranch(branch, progress);
    if (progress < 1) finished = false;
  }

  if (finished && !greetingShown) {
    showGreeting();
  }

  if (!finished) {
    animationFrame = requestAnimationFrame(step);
  }
}

function drawBranch(branch, progress) {
  const { start, end, thickness, depth } = branch;
  const currentX = start.x + (end.x - start.x) * progress;
  const currentY = start.y + (end.y - start.y) * progress;

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(currentX, currentY);
  ctx.lineWidth = thickness;
  const hue = 315 - depth * 8;
  const lightness = 55 + depth * 2;
  ctx.strokeStyle = `hsl(${hue}, 70%, ${Math.min(lightness, 75)}%)`;
  ctx.stroke();

  if (depth === CONFIG.maxDepth && progress === 1) {
    ctx.beginPath();
    ctx.fillStyle = `hsl(${hue + 10}, 80%, 75%)`;
    ctx.arc(end.x, end.y, Math.max(thickness * 0.35, 1.2), 0, Math.PI * 2);
    ctx.fill();
  }
}

// Returns eased progress for the current branch based on global animation time.
function progressFor(branch, elapsed) {
  const relative = (elapsed - branch.startTime) / branch.duration;
  if (relative >= 1) return 1;
  if (relative <= 0) return 0;
  return easeOutCubic(relative);
}

function showGreeting() {
  greetingShown = true;
  greetingEl.classList.add("is-visible");
  greetingEl.setAttribute("aria-hidden", "false");
}

function positionGreeting() {
  // Convert the canopy peak into canvas coordinates to anchor the label.
  const topPoint = normalizePoint({
    x: (bounds.minX + bounds.maxX) / 2,
    y: bounds.maxY,
  });
  const greetingBox = greetingEl.getBoundingClientRect();
  const computed = window.getComputedStyle(greetingEl);
  const fallbackHeight = parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.2 || 24;
  const greetingHeight = greetingBox.height || fallbackHeight;
  const gap = Math.max(greetingHeight * 0.2, 12);
  const safeMargin = 24;
  const candidateTop = topPoint.y - greetingHeight - gap;
  const clampedTop = Math.max(candidateTop, safeMargin);

  greetingEl.style.left = `${layout.width / 2}px`;
  greetingEl.style.top = `${clampedTop}px`;
}

function prepareBranches(currentLayout) {
  // Convert all normalized branch coordinates into on-screen pixels up front
  // so the render loop avoids redundant math.
  return branches.map((branch) => ({
    ...branch,
    start: normalizePoint(branch.start, currentLayout),
    end: normalizePoint(branch.end, currentLayout),
    thickness:
      CONFIG.baseThickness * Math.pow(CONFIG.thicknessDecay, branch.depth),
  }));
}

function computeLayout(width, height) {
  // Determine a scale+translation that keeps the full tree within view while
  // honoring the requested margins.
  const padding = Math.min(width, height) * 0.08;
  const normWidth = Math.max(bounds.maxX - bounds.minX, 0.01);
  const normHeight = Math.max(bounds.maxY - bounds.minY, 0.01);
  const scale = Math.min(
    (width - padding * 2) / normWidth,
    (height - padding * 2) / normHeight
  );
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return { width, height, scale, centerX, centerY, padding };
}

function normalizePoint(point, currentLayout = layout) {
  return {
    x:
      (point.x - currentLayout.centerX) * currentLayout.scale +
      currentLayout.width / 2,
    y:
      currentLayout.height / 2 -
      (point.y - currentLayout.centerY) * currentLayout.scale,
  };
}

function generateTree() {
  // Recursively create the binary tree in a normalized coordinate space so we
  // can project it into any viewport later.
  const seededRandom = createPRNG(CONFIG.seed);
  bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  const generated = [];

  (function grow(node) {
    const { x, y, length, angle, depth, startTime } = node;
    const rad = angleToRadians(angle);
    const x2 = x + length * Math.sin(rad);
    const y2 = y + length * Math.cos(rad);

    updateBounds(x, y, x2, y2);

    generated.push({
      start: { x, y },
      end: { x: x2, y: y2 },
      depth,
      startTime,
      duration: CONFIG.duration * Math.pow(CONFIG.durationDecay, depth),
    });

    if (depth >= CONFIG.maxDepth) return;

    const nextLength = length * CONFIG.lengthDecay;
    const jitterLeft = (seededRandom() - 0.5) * CONFIG.angleJitter;
    const jitterRight = (seededRandom() - 0.5) * CONFIG.angleJitter;
    const childStart = startTime + CONFIG.levelDelay;

    grow({
      x: x2,
      y: y2,
      length: nextLength,
      angle: angle - CONFIG.baseAngle + jitterLeft,
      depth: depth + 1,
      startTime: childStart,
    });

    grow({
      x: x2,
      y: y2,
      length: nextLength,
      angle: angle + CONFIG.baseAngle + jitterRight,
      depth: depth + 1,
      startTime: childStart,
    });
  })(
    { x: 0, y: 0, length: CONFIG.baseLength, angle: 0, depth: 0, startTime: 0 }
  );

  return generated;
}

function updateBounds(x1, y1, x2, y2) {
  bounds.minX = Math.min(bounds.minX, x1, x2);
  bounds.maxX = Math.max(bounds.maxX, x1, x2);
  bounds.minY = Math.min(bounds.minY, y1, y2);
  bounds.maxY = Math.max(bounds.maxY, y1, y2);
}

// Lightweight debounce used to coalesce rapid resize events.
function debounce(fn, wait = 100) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(null, args), wait);
  };
}

function createPRNG(seed) {
  return function () {
    seed = Math.imul(1664525, seed) + 1013904223;
    return ((seed >>> 0) & 0xffffffff) / 0x100000000;
  };
}

function angleToRadians(deg) {
  return (deg * Math.PI) / 180;
}

function easeOutCubic(t) {
  const inv = t - 1;
  return inv * inv * inv + 1;
}
