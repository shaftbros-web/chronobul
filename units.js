// =====================
// ユニットの基本ステータス
// ====================
let unitStats = {
  swordsman:{hp:120, atk:10, speed:0.25, range:25}, // ナイト
  archer:{hp:80, atk:8, meleeAtk:2, speed:0.2, range:140}, // アーチャー
  healer:{hp:100, atk:10, meleeAtk:2, speed:0.2, range:100}, // クレリック
  goblin:{hp:60, atk:5, speed:0.20, range:25}, // ゴブリン
  orc:{hp:200, atk:15, speed:0.20, range:25}, // オーク
  shaman:{hp:120, atk:12, meleeAtk:5, speed:0.25, range:140}, // シャーマン
  phantom:{hp:80, atk:10, meleeAtk:5, speed:0.4, range:120}, // ファントム
  golem:{hp:400, atk:20, meleeAtk:20, speed:0.1, range:100}, // ゴーレム

  // 🆕 ボス追加
  giantGolem:{hp:1500, atk:40, meleeAtk:40, speed:0.1, range:250}, // 巨大ゴーレム
  dragon:{hp:2500, atk:50, meleeAtk:80, speed:0.1, range:250}       // 邪竜
};

// =====================
// ユニットクラス
// =====================
class Unit {
  constructor(type, side, lane, y){
    this.type=type; this.side=side; this.lane=lane;
    this.x = lane*(canvas.width/5) + (canvas.width/10);
    this.y = y;
    const st = unitStats[type];
    this.hp=st.hp; this.atk=st.atk;
    this.meleeAtk = (st.meleeAtk !== undefined) ? st.meleeAtk : st.atk;
    this.speed=st.speed||0.2;
    this.range=st.range||25;

    this.role = "melee";
    if(type==="archer") this.role="archer";
    if(type==="healer") this.role="healer";
    if(type==="shaman") this.role="shaman";
    if(type==="phantom") this.role="phantom";
    if(type==="golem" || type==="giantGolem") this.role="golem";
    if(type==="dragon") this.role="dragon";

    this.color = (side==="player") ?
      (type==="archer"?"cyan":type==="healer"?"green":"blue") : "red";

    const nameMap={
      swordsman:"ナ", archer:"弓", healer:"聖",
      goblin:"ゴ", orc:"オ", shaman:"シ",
      phantom:"フ", golem:"ゴレ",
      giantGolem:"巨", dragon:"竜"
    };
    this.label = nameMap[type]||"?";
    this.target=null; this.cooldown=0;
  }

  draw(){
    ctx.fillStyle=this.color;
    ctx.beginPath(); ctx.arc(this.x,this.y,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=(this.side==="player")?"white":"black";
    ctx.font="14px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(this.label,this.x,this.y);
  }

  update(){
    if(this.target){
      if(this.target.hp<=0 || !inMeleeRange(this,this.target)) this.target=null;
      else return;
    }

    // 遠隔持ちは射程内に敵がいたら停止
    if(this.role==="archer" || this.role==="healer" || this.role==="shaman" ||
       this.role==="phantom" || this.role==="golem" || this.role==="dragon" ||
       this.role==="giantGolem"){
      let enemyList = (this.side==="player") ? enemyUnits : playerUnits;
      for(const e of enemyList){
        if(inUnitRange(this,e)){
          return;
        }
      }
    }

    this.y += (this.side==="player" ? -this.speed : this.speed);
  }
}

window.unitStats = unitStats;
window.Unit = Unit;
