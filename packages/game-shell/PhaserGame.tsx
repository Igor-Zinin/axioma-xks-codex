
"use client";

import { useEffect, useRef } 
from "react";

interface PhaserGameProps {
  
config: any;
  type: string;
  activeScreen?:
 'main' | 'gameplay' | 'shop';
}

export func
tion PhaserGame({ config, type, activeScreen 
}: PhaserGameProps) {
  const gameRef = useRe
f<HTMLDivElement>(null);
  const phaserInstan
ce = useRef<any>(null);

  useEffect(() => {

    if (!gameRef.current) return;

    let is
Cancelled = false;

    async function initPh
aser() {
      const Phaser = await import("p
haser");
      
      if (isCancelled || !gam
eRef.current) return;

      if (phaserInstan
ce.current) {
        phaserInstance.current.
destroy(true);
      }

      const isDungeon
 = type === 'caves-and-monsters';
      
    
  let currentDisplayScreen = activeScreen || 
'main';

      const gameConfig: any = {
    
    type: Phaser.AUTO,
        parent: gameRe
f.current,
        backgroundColor: "#000000"
,
        transparent: false,
        pixelAr
t: true,
        antialias: false,
        ro
undPixels: true,
        scale: {
          m
ode: Phaser.Scale.FIT,
          autoCenter: 
Phaser.Scale.CENTER_BOTH,
          width: 40
0,
          height: 660, 
        },
       
 physics: {
          default: "arcade",
    
      arcade: {
            gravity: { x: 0, 
y: isDungeon ? 0 : (config.mechanics?.gravity
 || 0) * 800 },
            debug: false
    
      },
        },
        scene: {
        
  preload: function(this: any) {
            
this.load.image("hero", config.assets?.hero |
| "https://picsum.photos/seed/hero/200/200");

            this.load.image("bg", config.ass
ets?.bg || "https://picsum.photos/seed/bg/400
/660");
          },
          create: functi
on(this: any) {
            this.add.image(20
0, 330, "bg").setDisplaySize(400, 660).setAlp
ha(0.25);
            this.renderScreen();

 
           // Auto-pause imitation
          
  document.addEventListener('visibilitychange
', () => {
              if (document.hidden)
 this.scene.pause();
              else this.
scene.resume();
            });
          },

          update: function(this: any, time: n
umber, delta: number) {
            const act
or = this.data.get('actor');
            if (
actor) {
              const speedMultiplier 
= delta / 16.6;
              if (!isDungeon)
 {
                actor.angle += (config.mec
hanics?.speed || 1) * speedMultiplier;
      
        } else {
                actor.y += M
ath.sin(time / 500) * (speedMultiplier * 2);

              }
            }
          },
  
      },
      };

      const createScreenRe
nderer = (scene: any) => {
        scene.rend
erScreen = function() {
          if (scene.s
creenGroup) scene.screenGroup.destroy(true);

          scene.screenGroup = scene.add.group
();

          if (currentDisplayScreen === '
main') {
            createMainScreen(scene);

          } else if (currentDisplayScreen ==
= 'gameplay') {
            createGameplay(sc
ene);
          } else if (currentDisplayScre
en === 'shop') {
            createShopScreen
(scene);
          }
        };
      };

   
   function createGameplay(scene: any) {
    
    const actor = scene.physics.add.sprite(20
0, 300, "hero");
        actor.setDisplaySize
(isDungeon ? 150 : 80, isDungeon ? 150 : 80);

        actor.setCollideWorldBounds(true);
 
       actor.setBounce(0.5);
        scene.da
ta.set('actor', actor);
        scene.screenG
roup.add(actor);

        const scoreText = s
cene.add.text(20, 40, isDungeon ? "GOLD: 0" :
 "TON: 0.000", {
          fontSize: "24px",

          fontFamily: "Source Code Pro",
    
      color: "#00f5ff",
          stroke: "#0
00",
          strokeThickness: 4
        });

        scene.screenGroup.add(scoreText);

 
       let score = 0;
        let currentHp =
 config.mechanics?.monsterHp || 10;
        c
onst maxHp = config.mechanics?.monsterHp || 1
0;
        
        let hpBar: any;
        i
f (isDungeon) {
          hpBar = scene.add.g
raphics();
          scene.screenGroup.add(hp
Bar);
          updateHpBar();
        }

   
     function updateHpBar() {
          if (!
hpBar) return;
          hpBar.clear();
     
     hpBar.fillStyle(0x333333, 0.8);
        
  hpBar.fillRect(100, 200, 200, 20);
        
  const percent = Math.max(0, currentHp / max
Hp);
          hpBar.fillStyle(0xff0055, 1);

          hpBar.fillRect(100, 200, 200 * perc
ent, 20);
        }

        scene.input.on("
pointerdown", (pointer: any) => {
          i
f (currentDisplayScreen !== 'gameplay') retur
n;

          // Haptic feedback simulation
 
         if (window.parent && (window.parent 
as any).Telegram?.WebApp?.HapticFeedback) {
 
           (window.parent as any).Telegram.We
bApp.HapticFeedback.impactOccurred('light');

          }

          if (isDungeon) {
     
       const dmg = config.mechanics?.clickDam
age || 1;
            currentHp -= dmg;
     
       scene.tweens.add({
              targe
ts: actor,
              x: actor.x + (Math.r
andom() * 10 - 5),
              y: actor.y +
 (Math.random() * 10 - 5),
              dura
tion: 50,
              yoyo: true
          
  });
            actor.setTint(0xff0000);
  
          scene.time.delayedCall(80, () => ac
tor.clearTint());

            if (currentHp 
<= 0) {
              score += 10;
          
    scoreText.setText(`GOLD: ${score}`);
    
          currentHp = maxHp;
              sc
ene.tweens.add({
                targets: act
or,
                alpha: 0,
               
 scale: 0.1,
                duration: 200,
 
               onComplete: () => {
          
        actor.setScale(isDungeon ? 0.75 : 0.4
); 
                  actor.setAlpha(1);
    
              updateHpBar();
                
}
              });
            }
           
 updateHpBar();
          } else {
          
  score += 0.001;
            scoreText.setTe
xt(`TON: ${score.toFixed(3)}`);
            i
f (config.mechanics?.gravity > 0) {
         
     actor.setVelocityY(-400);
            }

          }
        });

        const backBt
n = scene.add.text(200, 600, "ВЕРНУТЬ�
�Я В МЕНЮ", { 
          fontSize: '14p
x', 
          color: '#ffffff', 
          f
ontFamily: 'Source Code Pro',
          backg
roundColor: '#00000088',
          padding: {
 x: 20, y: 10 }
        }).setOrigin(0.5).set
Interactive({ useHandCursor: true });
       
 scene.screenGroup.add(backBtn);
        
   
     backBtn.on('pointerdown', () => {
      
    currentDisplayScreen = 'main';
          
scene.renderScreen();
        });
      }

  
    function createMainScreen(scene: any) {
 
       const title = scene.add.text(200, 180,
 config.screens?.main?.title || config.title,
 {
          fontSize: "32px",
          font
Family: "Space Grotesk",
          color: "#0
0f5ff",
          align: "center",
          
wordWrap: { width: 350 }
        }).setOrigin
(0.5).setShadow(0, 0, "#00f5ff", 15, true, tr
ue);
        scene.screenGroup.add(title);

 
       // Improved Button Hit Area
        co
nst btnBg = scene.add.rectangle(200, 420, 260
, 80, 0xbf36ff, 0.6).setInteractive({ useHand
Cursor: true });
        btnBg.setStrokeStyle
(2, 0xbf36ff, 1);
        scene.screenGroup.a
dd(btnBg);
        
        const btnText = s
cene.add.text(200, 420, config.screens?.main?
.startButton || "ИГРАТЬ", {
          f
ontSize: "24px",
          fontFamily: "Sourc
e Code Pro",
          color: "#fff",
       
   fontStyle: "bold"
        }).setOrigin(0.5
);
        scene.screenGroup.add(btnText);

 
       btnBg.on('pointerdown', () => {
      
    currentDisplayScreen = 'gameplay';
      
    scene.renderScreen();
        });

      
  // Pulsing animation
        scene.tweens.a
dd({
          targets: [btnBg, btnText],
   
       scale: 1.05,
          duration: 1000,

          yoyo: true,
          repeat: -1,

          ease: 'Sine.easeInOut'
        });


        const shopBtn = scene.add.text(200, 
520, "МАГАЗИН", { 
          fontSize:
 '20px', 
          color: '#00f5ff',
       
   fontFamily: 'Source Code Pro',
          f
ontStyle: 'bold',
          backgroundColor: 
'#00000044',
          padding: { x: 20, y: 1
0 }
        }).setOrigin(0.5).setInteractive(
{ useHandCursor: true });
        scene.scree
nGroup.add(shopBtn);
        
        shopBtn
.on('pointerdown', () => {
          currentD
isplayScreen = 'shop';
          scene.render
Screen();
        });
      }

      function
 createShopScreen(scene: any) {
        const
 title = scene.add.text(200, 80, "МАГАЗ�
�Н", {
          fontSize: "28px",
         
 fontFamily: "Space Grotesk",
          color
: "#00f5ff",
          fontStyle: 'bold'
    
    }).setOrigin(0.5);
        scene.screenGr
oup.add(title);

        const backBtn = scen
e.add.text(200, 600, "< ВЕРНУТЬСЯ", 
{ 
          fontSize: '16px', 
          col
or: '#fff',
          fontFamily: 'Source Cod
e Pro',
          backgroundColor: '#ffffff22
',
          padding: { x: 20, y: 15 }
      
  }).setOrigin(0.5).setInteractive({ useHandC
ursor: true });
        scene.screenGroup.add
(backBtn);
        
        backBtn.on('point
erdown', () => {
          currentDisplayScre
en = 'main';
          scene.renderScreen();

        });

        scene.add.text(200, 130,
 config.screens?.shop?.promoText || "ЛУЧШ
АЯ ЦЕНА!", {
          fontSize: "14px"
,
          fontFamily: "Source Code Pro",
  
        color: "#ff0055",
        }).setOrigi
n(0.5);

        for (let i = 0; i < 3; i++) 
{
          const y = 240 + (i * 100);
      
    const bg = scene.add.rectangle(200, y, 34
0, 80, 0xffffff, 0.05).setStrokeStyle(1, 0xff
ffff, 0.2);
          scene.screenGroup.add(b
g);
          const t1 = scene.add.text(60, y
 - 15, `АРТЕФАКТ #${i+1}`, { fontSize
: "16px", color: "#00f5ff", fontFamily: 'Sour
ce Code Pro' });
          const t2 = scene.a
dd.text(60, y + 10, `Цена: ${250 * (i+1)}
 Stars`, { fontSize: "12px", color: "#ffffff4
4" });
          scene.screenGroup.add(t1);
 
         scene.screenGroup.add(t2);
        }

      }

      const game = new Phaser.Game(
gameConfig);
      phaserInstance.current = g
ame;
      
      game.events.once('ready', (
) => {
        const scene = game.scene.getAt
(0);
        createScreenRenderer(scene);
   
   });
    }

    initPhaser();

    return (
) => {
      isCancelled = true;
      if (ph
aserInstance.current) {
        phaserInstanc
e.current.destroy(true);
        phaserInstan
ce.current = null;
      }
    };
  }, [confi
g, type, activeScreen]);

  return (
    <div
 className="relative w-full h-full bg-black f
lex items-center justify-center overflow-hidd
en">
      <div ref={gameRef} className="w-fu
ll h-full" />
    </div>
  );
}



