// =====================
// ゲーム進行制御 
// =====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let playerBaseHP, enemyBaseHP, playerUnits, enemyUnits, projectiles, hitMarks, swingMarks;
let pendingUnitType = null;
let enemySpawnTimer = null;

// 近接判定
function inMeleeRange(a, b) {
  const laneDiff = Math.abs(a.lane - b.lane);
  const dy = Math.abs(a.y - b.y);
  if (laneDiff === 0) return dy <= 24;
  if (laneDiff === 1) return dy <= 20;
  return false;
}

// 射程判定
function inUnitRange(a, b) {
  const dx = (a.lane - b.lane) * (canvas.width / 5);
  const dy = (a.y - b.y);
  return Math.hypot(dx, dy) <= a.range;
}

// マナ変数の定義
let mana = { freeze: 0, meteor: 0, heal: 0 };
const maxMana = { freeze: 100, meteor: 150, heal: 120 };

function startGame() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("settings").style.display = "none";
  document.getElementById("help").style.display = "none";
  document.getElementById("title").style.display = "none";
  canvas.style.display = "block";
  document.getElementById("ui").style.display = "block";

  // ✅ ここを追加
  document.getElementById("specialUI").style.display = "block";

  playerBaseHP = 100; enemyBaseHP = 100;
  playerUnits = []; enemyUnits = []; projectiles = []; hitMarks = []; swingMarks = [];
  if (enemySpawnTimer) clearInterval(enemySpawnTimer);
  enemySpawnTimer = setInterval(spawnEnemy, 4000);

  canvas.onclick = (e) => {
    if (!pendingUnitType) return;
    const rect = canvas.getBoundingClientRect();
    const lane = Math.floor((e.clientX - rect.left) / (canvas.width / 5));
    playerUnits.push(new Unit(pendingUnitType, "player", lane, canvas.height - 40));
    pendingUnitType = null;
  };

  requestAnimationFrame(loop);
}

function spawnEnemy() {
  if (singleSpawnType) {
    // 単体モード：センターレーンに1体だけ出現
    enemyUnits.push(new Unit(singleSpawnType, "enemy", 2, 40));
    clearInterval(enemySpawnTimer); // 1体だけにするので以降停止
    return;
  }

  // 通常モード
  const types = ["goblin", "orc", "golem", "shaman", "phantom"];
  const type = types[Math.floor(Math.random() * types.length)];
  const lane = Math.floor(Math.random() * 5);
  enemyUnits.push(new Unit(type, "enemy", lane, 40));
}

function updateManaUI(type) {
  const bar = document.getElementById(type + "Bar");
  const btn = document.getElementById(type + "Btn");
  if (!bar || !btn) return;

  bar.value = mana[type];

  if (mana[type] >= maxMana[type]) {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
}


function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#555";
  for (let i = 1; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(i * canvas.width / 5, 0); ctx.lineTo(i * canvas.width / 5, canvas.height); ctx.stroke();
  }
  ctx.fillStyle = "white";
  ctx.fillText(`自陣HP:${playerBaseHP}`, 10, 15);
  ctx.fillText(`敵陣HP:${enemyBaseHP}`, 280, 15);

  for (const u of [...playerUnits, ...enemyUnits]) { u.update(); u.draw(); }

  // === 自軍攻撃 ===
  for (const p of playerUnits) {
    for (const e of enemyUnits) {
      if (inMeleeRange(p, e)) {
        p.target = e; e.target = p;
        if (p.cooldown <= 0) {
          let dmg = (p.meleeAtk !== undefined) ? p.meleeAtk : p.atk;
          e.hp -= dmg;
          hitMarks.push(new HitMark(e.x, e.y));
          swingMarks.push(new SwingMark(p.x, p.y, "player"));
          p.cooldown = 60;   // ★ 30 → 60
        }
        if (e.cooldown <= 0) {
          let dmg = (e.meleeAtk !== undefined) ? e.meleeAtk : e.atk;
          p.hp -= dmg;
          hitMarks.push(new HitMark(p.x, p.y));
          swingMarks.push(new SwingMark(e.x, e.y, "enemy"));
          e.cooldown = 80;   // ★ 40 → 80
        }
      } else {
        if (p.role === "archer" && inUnitRange(p, e) && p.cooldown <= 0) {
          projectiles.push(new Projectile(p.x, p.y - 12, e, p.atk, "white"));
          p.cooldown = 120;  // ★ 60 → 120
        }
      }
    }
    if (p.role === "healer" && p.cooldown <= 0) {
      for (const ally of playerUnits) {
        if (ally !== p && ally.hp > 0 && ally.hp < unitStats[ally.type].hp && inUnitRange(p, ally)) {
          projectiles.push(new HealProjectile(p.x, p.y - 12, ally, p.atk));
          p.cooldown = 180;  // ★ 90 → 180
          break;
        }
      }
    }
  }

  // === 敵攻撃 ===
  for (const e of enemyUnits) {
    if (e.target && e.target.hp > 0) {
      // 戦闘中は移動・射撃なし
    } else {
      if (e.role === "shaman" && e.cooldown <= 0 && playerUnits.length > 0) {
        const t = playerUnits[Math.floor(Math.random() * playerUnits.length)];
        if (inUnitRange(e, t)) {
          projectiles.push(new Projectile(e.x, e.y + 12, t, e.atk, "purple"));
          e.cooldown = 160;  // ★ 80 → 160
        }
      }
      if (e.role === "phantom" && e.cooldown <= 0 && playerUnits.length > 0) {
        const t = playerUnits[Math.floor(Math.random() * playerUnits.length)];
        if (inUnitRange(e, t)) {
          projectiles.push(new Projectile(e.x, e.y + 12, t, e.atk, "yellow"));
          e.cooldown = 100;  // ★ 50 → 100
        }
      }
      if (e.role === "golem" && e.cooldown <= 0 && playerUnits.length > 0) {
        const t = playerUnits[Math.floor(Math.random() * playerUnits.length)];
        if (inUnitRange(e, t)) {
          projectiles.push(new Projectile(e.x, e.y + 12, t, e.atk, "brown"));
          e.cooldown = 200;  // ★ 100 → 200
        }
      }
    }
  }

  for (const u of [...playerUnits, ...enemyUnits]) if (u.cooldown > 0) u.cooldown--;

  for (const pr of projectiles) { pr.update(); pr.draw(); }
  projectiles = projectiles.filter(pr => pr.active);
  for (const h of hitMarks) { h.update(); h.draw(); }
  hitMarks = hitMarks.filter(h => h.life > 0);
  for (const s of swingMarks) { s.update(); s.draw(); }
  swingMarks = swingMarks.filter(s => s.life > 0);

  // 到達処理
  playerUnits = playerUnits.filter(u => u.hp > 0 && u.y > 0);
  enemyUnits = enemyUnits.filter(u => u.hp > 0 && u.y < canvas.height);
  for (const e of enemyUnits) { if (e.y >= canvas.height - 30) { playerBaseHP -= e.atk; e.hp = 0; } }
  for (const p of playerUnits) { if (p.y <= 30) { enemyBaseHP -= p.atk; p.hp = 0; } }

  // === マナ自動回復 ===
  mana.freeze = Math.min(maxMana.freeze, mana.freeze + 0.167);  // 10秒でMAX
  mana.meteor = Math.min(maxMana.meteor, mana.meteor + 0.0625); // 40秒でMAX
  mana.heal = Math.min(maxMana.heal, mana.heal + 0.1);    // 20秒でMAX

  updateManaUI("freeze");
  updateManaUI("meteor");
  updateManaUI("heal");


  if (playerBaseHP <= 0) { endScreen("GAME OVER", "red"); return; }
  if (enemyBaseHP <= 0) { endScreen("VICTORY!", "yellow"); return; }

  requestAnimationFrame(loop);
}

function endScreen(text, color) {
  if (enemySpawnTimer) { clearInterval(enemySpawnTimer); enemySpawnTimer = null; }
  ctx.fillStyle = color; ctx.font = "30px sans-serif"; ctx.fillText(text, 120, 300);

  // ✅ ゲーム終了時は非表示
  document.getElementById("specialUI").style.display = "none";
}


function chooseUnit(type) { pendingUnitType = type; }

function useSpecial(type) {
  if (type === "freeze" && mana.freeze >= maxMana.freeze) {
    // 5秒間、敵を停止
    for (const e of enemyUnits) { e.speedBackup = e.speed; e.speed = 0; }
    setTimeout(() => {
      for (const e of enemyUnits) { if (e.speedBackup !== undefined) { e.speed = e.speedBackup; delete e.speedBackup; } }
    }, 5000);
    mana.freeze = 0;
  }

  if (type === "meteor" && mana.meteor >= maxMana.meteor) {
    // 画面内の敵に大ダメージ
    for (const e of enemyUnits) { e.hp -= 50; }
    mana.meteor = 0;
  }

  if (type === "heal" && mana.heal >= maxMana.heal) {
    // 味方全体を回復
    for (const p of playerUnits) { p.hp += 30; }
    mana.heal = 0;

  }

  // UI更新
  updateManaUI("freeze");
  updateManaUI("meteor");
  updateManaUI("heal");

  mana[type] = 0;
  updateManaUI(type);
}


// === window登録 ===
window.startGame = startGame;
window.applySettingsAndStart = applySettingsAndStart;
window.showSettings = showSettings;
window.backToMenu = backToMenu;
window.showHelp = showHelp;
window.backToMenuFromHelp = backToMenuFromHelp;
window.chooseUnit = chooseUnit;
