class Projectile {
  constructor(x, y, target, atk, color = "white") { this.x = x; this.y = y; this.target = target; this.atk = atk; this.speed = 3; this.active = true; this.color = color; }
  update() {
    if (!this.target || this.target.hp <= 0) { this.active = false; return; }
    const dx = this.target.x - this.x, dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 5) { this.target.hp -= this.atk; hitMarks.push(new HitMark(this.target.x, this.target.y)); this.active = false; }
    else { this.x += (dx / d) * this.speed; this.y += (dy / d) * this.speed; }
  }
  draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill(); }
}

class HealProjectile {
  constructor(x, y, target, amount) { this.x = x; this.y = y; this.target = target; this.amount = amount; this.speed = 3; this.active = true; }
  update() {
    if (!this.target || this.target.hp <= 0) { this.active = false; return; }
    const dx = this.target.x - this.x, dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 5) { this.target.hp += this.amount; hitMarks.push(new HealMark(this.target.x, this.target.y)); this.active = false; }
    else { this.x += (dx / d) * this.speed; this.y += (dy / d) * this.speed; }
  }
  draw() { ctx.fillStyle = "lime"; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill(); }
}
class HitMark {
  constructor(x, y) { this.x = x; this.y = y; this.life = 15; } update() { this.life--; }
  draw() {
    ctx.lineWidth = 3; ctx.strokeStyle = "red"; ctx.beginPath(); ctx.moveTo(this.x - 8, this.y - 8); ctx.lineTo(this.x + 8, this.y + 8);
    ctx.moveTo(this.x + 8, this.y - 8); ctx.lineTo(this.x - 8, this.y + 8); ctx.stroke(); ctx.lineWidth = 1;
  }
}
class HealMark {
  constructor(x, y) { this.x = x; this.y = y; this.life = 15; } update() { this.life--; }
  draw() { ctx.strokeStyle = "lime"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x, this.y, 14, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
}
class SwingMark {
  constructor(x, y, side) { this.x = x; this.y = y; this.life = 12; this.side = side; } update() { this.life--; }
  draw() {
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = (this.side === "player") ? "#88f" : "#f88";
    ctx.beginPath(); ctx.arc(this.x, this.y, 16, -Math.PI / 3, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.x, this.y, 12, 0, Math.PI / 3); ctx.stroke(); ctx.restore();
  }
}
