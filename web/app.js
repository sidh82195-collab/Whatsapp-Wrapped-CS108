// app.js — WhatsApp Wrapped 2024
// reads data.json, builds slides, handles navigation

let currentSlide = 0;
let slides = [];
let chartInstances = {}; // store chart refs so we can destroy/redraw

// ── avatar colours per person ──
const avatarColors = [
  "#25D366","#FFD60A","#ff6b6b","#74b9ff","#a29bfe","#fd79a8","#00cec9"
];
const personEmoji = {
  Shreya: "🦋", Rishabh: "🦉", Rajit: "📚", Arush: "🤏",
  Sudhansh: "⚽", Praveen: "🕐", Vishal: "🪨"
};

// ── fetch data.json and build everything ──
fetch("../data.json")
  .then(r => r.json())
  .then(data => {
    buildSlides(data);
    renderSlide(0);
  })
  .catch(() => {
    // fallback: try same directory
    fetch("data.json")
      .then(r => r.json())
      .then(data => { buildSlides(data); renderSlide(0); });
  });

// ── keyboard navigation ──
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight" || e.key === " ") nextSlide();
  if (e.key === "ArrowLeft") prevSlide();
});

function nextSlide() {
  if (currentSlide < slides.length - 1) renderSlide(currentSlide + 1);
}
function prevSlide() {
  if (currentSlide > 0) renderSlide(currentSlide - 1);
}

function renderSlide(idx) {
  const wrapper = document.getElementById("slidesWrapper");
  // deactivate all
  wrapper.querySelectorAll(".slide").forEach(s => s.classList.remove("active"));

  currentSlide = idx;
  const el = wrapper.querySelector(`[data-idx="${idx}"]`);
  if (el) {
    el.classList.add("active");
    // trigger any charts in this slide
    triggerCharts(el);
  }

  // update progress bar
  const pct = ((idx + 1) / slides.length) * 100;
  document.getElementById("progressBar").style.width = pct + "%";

  // update counter
  document.getElementById("slideCounter").textContent = `${idx + 1} / ${slides.length}`;

  // hide/show nav
  document.getElementById("prevBtn").style.opacity = idx === 0 ? "0.2" : "1";
  document.getElementById("nextBtn").style.opacity = idx === slides.length - 1 ? "0.2" : "1";
}

// ── chart trigger (called when slide becomes active) ──
function triggerCharts(slideEl) {
  const canvases = slideEl.querySelectorAll("canvas[data-chart]");
  canvases.forEach(canvas => {
    const id = canvas.id;
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }
    const cfg = JSON.parse(canvas.dataset.chart);
    chartInstances[id] = new Chart(canvas, cfg);
  });
}

// ══════════════════════════════════════════
// SLIDE BUILDERS
// ══════════════════════════════════════════

function buildSlides(data) {
  const wrapper = document.getElementById("slidesWrapper");
  const g = data.group_stats;
  const pp = data.per_person;
  const names = Object.keys(pp);
  const colorMap = {};
  names.forEach((n, i) => colorMap[n] = avatarColors[i % avatarColors.length]);

  const slideBuilders = [
    () => slideIntro(),
    () => slideTotalMessages(pp, colorMap),
    () => slideTotalWords(pp, colorMap),
    () => slideNightOwl(g, pp),
    () => slideGhost(g, pp),
    () => slideConversationStarter(g, pp, colorMap),
    () => slideBusiestDay(g),
    () => slideLongestSilence(g),
    () => slideAvgResponseTime(pp),
    () => slideHypePerson(g, pp),
    () => slideEmojiUsage(pp),
    () => slideStreaks(pp, colorMap),
    () => slideProfileSelector(pp, colorMap, names),
    ...names.map((name, i) => () => slideProfile(name, pp[name], colorMap[name], i)),
    () => slideOutro(g, pp, names),
  ];

  slideBuilders.forEach((builder, i) => {
    const el = builder();
    el.dataset.idx = i;
    el.classList.add("slide");
    wrapper.appendChild(el);
    slides.push(el);
  });
}

// ── helper: create slide div ──
function makeSlide(...extraClasses) {
  const div = document.createElement("div");
  div.classList.add(...extraClasses);
  return div;
}

// ── helper: blob decoration ──
function addBlob(parent, color, size, top, left) {
  const b = document.createElement("div");
  b.className = "blob";
  b.style.cssText = `width:${size}px;height:${size}px;background:${color};top:${top};left:${left};`;
  parent.appendChild(b);
}

// ── 1. INTRO ──
function slideIntro() {
  const s = makeSlide("slide-intro");
  s.innerHTML = `
    <div class="big-logo">💬</div>
    <h1>WhatsApp<br><span>Wrapped</span></h1>
    <div class="year-tag">CS-108 Group Chat · January 2024</div>
    <div class="subtitle">A year (ok, a few days) in group chat stats</div>
    <div class="click-hint">→ CLICK OR PRESS ARROW TO BEGIN</div>
  `;
  addBlob(s, "#25D366", 400, "10%", "60%");
  addBlob(s, "#128C7E", 300, "50%", "5%");
  return s;
}

// ── 2. Total messages ──
function slideTotalMessages(pp, colorMap) {
  const names = Object.keys(pp);
  const vals  = names.map(n => pp[n].total_messages);
  const maxVal = Math.max(...vals);

  const s = makeSlide("slide-chart");
  s.innerHTML = `
    <h2>Who <span class="hl">wouldn't stop</span> typing?</h2>
    <div class="rank-table" id="msgRankTable"></div>
  `;

  const table = s.querySelector("#msgRankTable");
  const sorted = names.map((n,i) => [n, vals[i]]).sort((a,b) => b[1]-a[1]);
  sorted.forEach(([name, val], i) => {
    const row = document.createElement("div");
    row.className = "rank-row";
    row.innerHTML = `
      <div class="rank-num">${i+1}</div>
      <div class="rank-name">${personEmoji[name] || "👤"} ${name}</div>
      <div class="rank-bar-wrap">
        <div class="rank-bar" style="width:${(val/maxVal*100).toFixed(1)}%;background:${colorMap[name]}"></div>
      </div>
      <div class="rank-val">${val}</div>
    `;
    table.appendChild(row);
  });

  addBlob(s, "#25D366", 350, "-10%", "70%");
  return s;
}

// ── 3. Total words ──
function slideTotalWords(pp, colorMap) {
  const names = Object.keys(pp);
  const vals  = names.map(n => pp[n].total_words);
  const maxVal = Math.max(...vals);

  const s = makeSlide("slide-chart");
  s.innerHTML = `
    <h2>Who writes <span class="hl">essays</span> in group chat?</h2>
    <div class="rank-table" id="wordRankTable"></div>
  `;

  const table = s.querySelector("#wordRankTable");
  const sorted = names.map((n,i) => [n, vals[i]]).sort((a,b) => b[1]-a[1]);
  sorted.forEach(([name, val], i) => {
    const row = document.createElement("div");
    row.className = "rank-row";
    row.innerHTML = `
      <div class="rank-num">${i+1}</div>
      <div class="rank-name">${personEmoji[name] || "👤"} ${name}</div>
      <div class="rank-bar-wrap">
        <div class="rank-bar" style="width:${(val/maxVal*100).toFixed(1)}%;background:${colorMap[name]}"></div>
      </div>
      <div class="rank-val">${val}w</div>
    `;
    table.appendChild(row);
  });

  addBlob(s, "#FFD60A", 300, "60%", "-5%");
  return s;
}

// ── 4. Night Owl ──
function slideNightOwl(g, pp) {
  const name = g.night_owl;
  const count = pp[name]?.night_owl_messages || 0;
  const s = makeSlide("slide-award");
  s.innerHTML = `
    <div class="blob" style="width:500px;height:500px;background:#1a1a2e;filter:blur(90px);top:-10%;left:20%;opacity:0.5"></div>
    <div class="award-emoji" style="animation-delay:0.1s">🦉</div>
    <div class="award-title">Night Owl Award</div>
    <div class="award-name">${name}</div>
    <div class="award-desc">Most active between 12am and 4am. Some people sleep, others type.</div>
    <div class="award-stat">${count} messages sent in the dead of night</div>
  `;
  return s;
}

// ── 5. Ghost ──
function slideGhost(g, pp) {
  const name = g.ghost;
  const replies = pp[name]?.reply_count || 0;
  const s = makeSlide("slide-award");
  s.innerHTML = `
    <div class="blob" style="width:400px;height:400px;background:#2d0000;filter:blur(90px);top:20%;left:30%;opacity:0.5"></div>
    <div class="award-emoji" style="animation-delay:0.1s">👻</div>
    <div class="award-title">Ghost of the Chat</div>
    <div class="award-name" style="color:var(--accent2)">${name}</div>
    <div class="award-desc">Fewest direct replies received. Speaks into the void.</div>
    <div class="award-stat">Only ${replies} times did anyone reply to them within 30 min</div>
  `;
  return s;
}

// ── 6. Conversation Starter ──
function slideConversationStarter(g, pp, colorMap) {
  const name = g.conversation_starter;
  const starts = pp[name]?.conversation_starts || 0;
  const s = makeSlide("slide-award");
  s.innerHTML = `
    <div class="blob" style="width:400px;height:400px;background:#003322;filter:blur(90px);top:20%;left:30%;opacity:0.5"></div>
    <div class="award-emoji" style="animation-delay:0.1s">🎙️</div>
    <div class="award-title">Conversation Starter</div>
    <div class="award-name" style="color:var(--green)">${name}</div>
    <div class="award-desc">Broke the silence the most. Group chat would be dead without them.</div>
    <div class="award-stat">Started ${starts} conversations after a long gap</div>
  `;
  return s;
}

// ── 7. Busiest Day ──
function slideBusiestDay(g) {
  const s = makeSlide("slide-stat");
  s.innerHTML = `
    <div class="stat-label">Busiest Day</div>
    <div class="stat-big accent">${g.busiest_day}</div>
    <div class="stat-desc">${g.busiest_day_count} messages flew on this one day alone.</div>
    <div class="stat-sub">the group was unwell. in a good way.</div>
  `;
  addBlob(s, "#FFD60A", 400, "30%", "60%");
  return s;
}

// ── 8. Longest Silence ──
function slideLongestSilence(g) {
  const s = makeSlide("slide-chart");
  s.innerHTML = `
    <h2>The <span class="hl">great silence</span></h2>
    <div class="silence-box">
      <div class="silence-hours">${g.longest_silence_hours}h</div>
      <div class="silence-label">of absolute radio silence</div>
      <div class="silence-range">From ${g.longest_silence_from} → ${g.longest_silence_to}</div>
    </div>
    <div style="font-family:'Space Mono',monospace;font-size:0.75rem;color:var(--muted)">
      everyone was busy or everyone was sleeping. probably sleeping.
    </div>
  `;
  addBlob(s, "#ff6b6b", 300, "60%", "70%");
  return s;
}

// ── 9. Avg Response Time ──
function slideAvgResponseTime(pp) {
  const names = Object.keys(pp).filter(n => pp[n].avg_response_time !== null);
  const sorted = names.sort((a, b) => pp[a].avg_response_time - pp[b].avg_response_time);

  const s = makeSlide("slide-chart");
  s.innerHTML = `
    <h2>Who <span class="hl">actually replies</span> fast?</h2>
    <div class="response-list" id="respList"></div>
    <div style="font-family:'Space Mono',monospace;font-size:0.7rem;color:var(--muted)">median minutes before replying · lower = faster</div>
  `;

  const list = s.querySelector("#respList");
  sorted.forEach(name => {
    const val = pp[name].avg_response_time;
    const row = document.createElement("div");
    row.className = "resp-row";
    row.innerHTML = `
      <div class="resp-name">${personEmoji[name] || "👤"} ${name}</div>
      <div class="resp-val">${val} min</div>
    `;
    list.appendChild(row);
  });

  addBlob(s, "#74b9ff", 300, "10%", "-5%");
  return s;
}

// ── 10. Hype Person ──
function slideHypePerson(g, pp) {
  const name = g.hype_person;
  const score = pp[name]?.hype_score || 0;
  const s = makeSlide("slide-award");
  s.innerHTML = `
    <div class="blob" style="width:400px;height:400px;background:#1a2d00;filter:blur(90px);top:20%;left:30%;opacity:0.5"></div>
    <div class="award-emoji" style="animation-delay:0.1s">⚡</div>
    <div class="award-title">Hype Person</div>
    <div class="award-name" style="color:var(--accent)">${name}</div>
    <div class="award-desc">Fastest average reply time. Always there, always typing.</div>
    <div class="award-stat">Median reply speed: ${score} minutes</div>
  `;
  return s;
}

// ── 11. Emoji Usage ──
function slideEmojiUsage(pp) {
  const names = Object.keys(pp);
  const s = makeSlide("slide-chart");
  s.innerHTML = `
    <h2>The <span class="hl">emoji</span> report</h2>
    <div class="emoji-grid" id="emojiGrid"></div>
  `;

  const grid = s.querySelector("#emojiGrid");
  names.forEach(name => {
    const emojis = pp[name].top_emojis || [];
    const row = document.createElement("div");
    row.className = "emoji-row-full";
    const emojiDisplay = emojis.length
      ? `<span class="emoji-icons">${emojis.join(" ")}</span>`
      : `<span class="emoji-empty">no emojis used 💀</span>`;
    row.innerHTML = `<div class="emoji-name">${personEmoji[name] || "👤"} ${name}</div>${emojiDisplay}`;
    grid.appendChild(row);
  });

  addBlob(s, "#a29bfe", 300, "60%", "70%");
  return s;
}

// ── 12. Streaks ──
function slideStreaks(pp, colorMap) {
  const names = Object.keys(pp);
  const vals  = names.map(n => pp[n].max_consecutive_streak);
  const maxVal = Math.max(...vals);

  const s = makeSlide("slide-chart");
  s.innerHTML = `
    <h2>Biggest <span class="hl">message streak</span></h2>
    <div class="rank-table" id="streakTable"></div>
    <div style="font-family:'Space Mono',monospace;font-size:0.7rem;color:var(--muted)">consecutive messages without anyone else replying</div>
  `;

  const table = s.querySelector("#streakTable");
  const sorted = names.map((n,i) => [n, vals[i]]).sort((a,b) => b[1]-a[1]);
  sorted.forEach(([name, val], i) => {
    const row = document.createElement("div");
    row.className = "rank-row";
    row.innerHTML = `
      <div class="rank-num">${i+1}</div>
      <div class="rank-name">${personEmoji[name] || "👤"} ${name}</div>
      <div class="rank-bar-wrap">
        <div class="rank-bar" style="width:${(val/maxVal*100).toFixed(1)}%;background:${colorMap[name]}"></div>
      </div>
      <div class="rank-val">${val}x</div>
    `;
    table.appendChild(row);
  });

  addBlob(s, "#fd79a8", 350, "60%", "-5%");
  return s;
}

// ── 13. Profile Selector ──
let selectedProfileIdx = null;
function slideProfileSelector(pp, colorMap, names) {
  const s = makeSlide("slide-chart", "profile-selector-slide");
  s.innerHTML = `
    <h2>Pick your <span class="hl">profile</span></h2>
    <p style="color:var(--muted);font-size:0.95rem">select someone to jump to their stats</p>
    <div class="profile-btns" id="profileBtns"></div>
    <p style="color:var(--muted);font-size:0.8rem;font-family:'Space Mono',monospace">
      or just keep clicking → to go through all profiles
    </p>
  `;

  const btns = s.querySelector("#profileBtns");
  names.forEach((name, i) => {
    const btn = document.createElement("button");
    btn.className = "profile-btn";
    btn.textContent = `${personEmoji[name] || "👤"} ${name}`;
    btn.style.borderColor = colorMap[name];
    btn.onclick = () => {
      // profile slides start at index 13 (0-based)
      renderSlide(13 + i);
    };
    btns.appendChild(btn);
  });

  addBlob(s, "#25D366", 400, "50%", "60%");
  return s;
}

// ── 14. Per-Person Profile ──
function slideProfile(name, stats, color, personIdx) {
  const s = makeSlide("slide-profile");
  const initials = name.slice(0, 2).toUpperCase();

  const avgResp = stats.avg_response_time !== null ? `${stats.avg_response_time} min` : "—";
  const hypeScore = stats.hype_score !== null ? `${stats.hype_score} min` : "—";
  const emojiDisplay = stats.top_emojis?.length ? stats.top_emojis.join(" ") : "none 🥲";

  // personality tag
  const tags = getPersonalityTag(name, stats);

  const canvasId = `chart-activity-${name}`;

  s.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar" style="background:${color}22;color:${color}">${initials}</div>
      <div>
        <div class="profile-name">${personEmoji[name] || ""} ${name}</div>
        <div class="profile-tag">${tags}</div>
      </div>
    </div>
    <div class="profile-grid">
      <div class="stat-card">
        <div class="sc-label">Messages</div>
        <div class="sc-val green">${stats.total_messages}</div>
      </div>
      <div class="stat-card">
        <div class="sc-label">Words</div>
        <div class="sc-val yellow">${stats.total_words}</div>
      </div>
      <div class="stat-card">
        <div class="sc-label">Night messages</div>
        <div class="sc-val blue">${stats.night_owl_messages}</div>
      </div>
      <div class="stat-card">
        <div class="sc-label">Avg response time</div>
        <div class="sc-val">${avgResp}</div>
      </div>
      <div class="stat-card">
        <div class="sc-label">Reply speed (hype)</div>
        <div class="sc-val red">${hypeScore}</div>
      </div>
      <div class="stat-card">
        <div class="sc-label">Max streak</div>
        <div class="sc-val">${stats.max_consecutive_streak}x</div>
      </div>
      <div class="stat-card" style="grid-column:span 2">
        <div class="sc-label">Top emojis</div>
        <div class="sc-val" style="font-size:1.6rem;letter-spacing:6px">${emojiDisplay}</div>
      </div>
      <div class="stat-card">
        <div class="sc-label">Convo starts</div>
        <div class="sc-val">${stats.conversation_starts}</div>
      </div>
    </div>
  `;

  addBlob(s, color, 350, "-15%", "70%");
  addBlob(s, color, 200, "70%", "-5%");
  return s;
}

function getPersonalityTag(name, stats) {
  const tags = [];
  if (stats.total_messages >= 80) tags.push("CHATTERBOX");
  if (stats.night_owl_messages >= 10) tags.push("NIGHT OWL");
  if (stats.reply_count <= 5) tags.push("GHOST MODE");
  if (stats.hype_score && stats.hype_score <= 6) tags.push("HYPE MACHINE");
  if (stats.max_consecutive_streak >= 7) tags.push("SPAM KING");
  if (stats.total_words / Math.max(stats.total_messages, 1) >= 7) tags.push("ESSAYIST");
  if (stats.total_words / Math.max(stats.total_messages, 1) <= 2) tags.push("DRY TEXTER");
  return tags.length ? tags.join(" · ") : "GROUP MEMBER";
}

// ── OUTRO ──
function slideOutro(g, pp, names) {
  const totalMsgs = Object.values(pp).reduce((a, b) => a + b.total_messages, 0);
  const totalWords = Object.values(pp).reduce((a, b) => a + b.total_words, 0);

  const s = makeSlide("slide-outro");
  s.innerHTML = `
    <div style="font-size:3rem;margin-bottom:16px">🎉</div>
    <h2>${totalMsgs} messages.<br><span class="green">${totalWords} words.</span><br>Zero assignments done.</h2>
    <p>Thanks for making the group chat worth opening.</p>
    <div class="mono">generated with chat.py · analyze.py · app.js · a lot of procrastination</div>
  `;
  addBlob(s, "#25D366", 350, "10%", "60%");
  addBlob(s, "#FFD60A", 250, "60%", "5%");
  return s;
}
