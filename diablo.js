(function(undefined) {

var imageCount=0;
var img_cache={};
function loadImage(url, gc){
    gc=typeof gc == typeof undefined ? true : gc;
    if(img_cache[url]){
        if(gc)
        img_cache[url].refs++;
        return img_cache[url];
    }
    var i=new Image();
    i.onload=function(){
        imageCount--; 
    }
    i.src=url;
    if(gc)
    i.refs=1;
    imageCount++;
    img_cache[url]=i;
    return i;
};
function freeImage(i){
    if(i.regs){ // is gc used
        i.refs--;
        // double check
        if(i.refs<1){
            setTimeout(function(){
                if(i.refs<1) delete img_cache[i.src];
            }, 10000);
        }
    }
}

var tw=512, th=tw/2, s=tw*0.705, a=Math.PI/4, log=[];
var asin=acos=Math.sin(a);
var floorMap=[
    "000000000000003000000000000000000000000000000000".split(""),
    "011110000000003000000000000000000000000000000000".split(""),
    "000210000000003000000000000000000000000000000000".split(""),
    "000111111111111111110000000000000000000000000000".split(""),
    "000000001000003001000000000000000000000000000000".split(""),
    "000000001000003001111111100000000000000000000000".split(""),
    "000000001000003000000000011111100000000000000000".split(""),
    "333333331333333000000000000000000000000000000000".split(""),
    "000000001100000000000000000000000000000000000000".split(""),
    "000000001111111000000000000000000000000000000000".split(""),
    "000000000100011000000000000000000000000000000000".split(""),
    "000000000100001000000000000000000000000000000000".split(""),
    "000000000100002000000000000000000000000000000000".split(""),
    "000000000100000000000000000000000000000000000000".split(""),
    "000000000110000000000000000000000000000000000000".split(""),
    "000002111111112000000000000000000000000000000000".split(""),
    "000000000000000000000000000000000000000000000000".split(""),
    "000000000000000000000000000000000000000000000000".split(""),
    "000000000000000000000000000000000000000000000000".split(""),
    "000000000000000000000000000000000000000000000000".split(""),
    "000000000000000000000000000000000000000000000000".split(""),
    "000000000000000000000000000000000000000000000000".split(""),
    "000000000000000000000000000000000000000000000000".split(""),
    "000000000000000000000000000000000000000000000000".split(""),
    "000000000000000000000000000000000000000000000000".split(""),
];

var floor=document.getElementById("floor").getContext("2d");
floor.w=floor.canvas.width;
floor.h=floor.canvas.height;

var tileMap={
    0: loadImage("texture/tileable-grey.png", true),
    1: loadImage("texture/dirtsand.png", true),
    2: loadImage("texture/tileable-grey.png", true),
    3: loadImage("texture/stone.png", true),
};

var barrelSprite=loadImage("sprite/barrel64.png", true);
var coinSprite=loadImage("sprite/coins10.png", true);
var houseSprite=loadImage("sprite/house.png", true);

// pre-fetch textures for Person class
var personTextures={};
var personTypes=["king_artur","safria_elf"];
for(var pt in personTypes){
    var name=personTypes[pt];
    var p={stay:[],run:[]};
    for(var i=1;i<=8;i++){
        p.stay[i-1]=["char/"+name+"/stand/"+i+".gif"];
        p.run[i-1]=[];
        for(var j=1;j<=15;j++){
            var j_s=j<10?"0"+j:j;
            p.run[i-1].push("char/"+name+"/anim/"+i+"_"+j_s+".gif");
        }
    }
    personTextures[name]=p;
}//*/

var bt=personTextures["barbarian"]={stay:[],run:[],attack:[]};
for(var ba=0;ba<=15;ba++){
    bt.stay[ba]=[];
    bt.run[ba]=[];
    bt.attack[ba]=[];
    for(var t=0;t<=0;t++) bt.stay[ba].push("char/barbarian/stay/"+ba+"-"+t+".png");
    for(var t=0;t<=7;t++) bt.run[ba].push("char/barbarian/run/"+ba+"-"+t+".png");
    for(var t=0;t<=8;t++) bt.attack[ba].push("char/barbarian/push/"+ba+"-"+t*2+".png");
}//*/

var hero=new BarbarianOptimized(s*1.5,s*1.5);
hero.health=hero.origin_health=1000;
var monsters=[];

// peacefull mobs
/*
for(var i=0;i<10;i++) {
    monsters.push(new PeacefullMob(Math.random()>0.5?"king_artur":"safria_elf",randomx(),randomy()));
}
*///*/
// aggresive mobs
for(var i=0;i<10;i++) {
    monsters.push(new BarbarianOptimized(randomx(),randomy()));
}//*/


setInterval(function() { // random step for mobs, attack hero
    var m=monsters[Math.ceil(Math.random()*(monsters.length-1))];
    m.to_x=m.x+(Math.random()*s-s/2);
    m.to_y=m.y+(Math.random()*s-s/2);
    for(var i in monsters){
        var m=monsters[i], attackDist=100;
        if(m.attack){
            if(Math.abs(hero.x-m.x)<attackDist &&
               Math.abs(hero.y-m.y)<attackDist){
               m.doAttack(hero);
            }else{
                m.to_x=hero.x
                m.to_y=hero.y
            }
        }
    }
}, 200);//*/

// restore hero health
setInterval(function(){
    hero.health=Math.min(hero.health+100, hero.origin_health);
},10000);


var barrels=[];
for(var i=0;i<33;i++) barrels.push(new Barrel(randomx(),randomy()));
barrels.push(new Barrel(100,100));
var coins=[];
var houses=[];
for(var y in floorMap){ // pre fetch house sprites;
    for(var x in floorMap[y]){
        if(floorMap[y][x]=="2"){
            var h=new House(
                (parseInt(x)+0.5)*s,
                (parseInt(y)+0.5)*s);
            houses.push(h);
        }
    }
}//*/

floor.canvas.onclick=function(e) { 
    var mx=e.offsetX - floor.w/2;
    var my=e.offsetY - floor.h/2;
    var isCanClick=Math.abs(mx) < 100 && Math.abs(my) < 100;
    my *= 2; //unscale
    floor.click_x=hero.x + mx * Math.cos(-a) - my * Math.sin(-a);
    floor.click_y=hero.y + mx * Math.sin(-a) + my * Math.cos(-a);
    if(isCanClick)if(processClick())return;
    hero.to_x=floor.click_x;
    hero.to_y=floor.click_y;
}//*/

var lastStep=0;
setInterval(function() {
    if(imageCount) return;
    if(lastStep==0){
        hero.nextStep();
        lastStep=1;
    }
    if(imageCount) return;
    if(lastStep==1){
        for(var i in monsters)monsters[i].nextStep();
        lastStep=2
    }
    if(imageCount) return;
    floor.fillStyle="black";floor.fillRect(0,0, floor.w,floor.h);
    renderFloor();
    renderLog();
    renderHeroHealth()
    lastStep=0;
}, 66);//*/

function renderHeroHealth(){
    var radius=80, padding=20;
    floor.save();
    floor.globalAlpha=0.4;
    // draw health colb
    floor.fillStyle="black";
    floor.beginPath();
    floor.arc(radius+padding, floor.h-radius-padding, radius+4, 0, Math.PI*2);
    floor.closePath();
    floor.fill();
    // draw health
    floor.fillStyle="red";        
    var percent = hero.health / hero.origin_health;
    var angleFrom = Math.PI*(0.5-percent);
    var angleTo   = Math.PI*(0.5+percent);
    floor.beginPath();
    floor.arc(radius+padding, floor.h-radius-padding, radius, angleFrom, angleTo);
    floor.closePath();
    floor.fill();
    floor.restore();
}

function processClick(){
    var zb=[];
    for(var m in monsters)zb.push(monsters[m]);
    for(var b in barrels)zb.push(barrels[b]);
    for(var c in coins)zb.push(coins[c]);
    zb.sort(function(a,b){ return b.x+b.y-a.x-a.y; });// first is asc
    var cx=(floor.click_x - floor.click_y)*acos,
        cy=(floor.click_x + floor.click_y)/2*asin;
    for(var i in zb){
        var m=zb[i]; 
        var spr=m.sprite;
        var sx=(m.x - m.y)*acos+m.offset_x,
            sy=(m.x + m.y)/2*asin+m.offset_y;
        if( cx >= sx-spr.width/2 && cx <= sx+spr.width/2 && cy >= sy-spr.height && cy <= sy){
            m.use(hero)
            return true;
        }
    }//*/
    return false;
}//*/

function renderObjects(){
    var zb=[];// z-buffer
    zb.push(hero);
    for(var m in monsters)zb.push(monsters[m]);
    for(var b in barrels)zb.push(barrels[b]);
    for(var c in coins)zb.push(coins[c]);
    for(var h in houses)zb.push(houses[h]);
    zb.sort(function(b,a){ return b.x+b.y-a.x-a.y; });//first is desc
    for(z in zb){
        var m=zb[z];
        if(!m.isAboveHero()) continue;
        floor.save()
        var sx=(m.x - m.y)*acos+m.offset_x,
            sy=(m.x + m.y)/2*asin+m.offset_y;
        var tile=m.sprite;
        // render sprite
        if(m.isOverHero && m.isOverHero()) floor.globalAlpha=0.5;
        floor.shadowColor = "rgba(0,0,0,0.7)"
        floor.shadowBlur = 10
        floor.shadowOffsetX = -10
        floor.shadowOffsetY = -10
        if(tile.angles && tile.steps){
            var tw = tile.width / tile.steps;
            var th = tile.height / tile.angles;        
            floor.drawImage(tile, 
                tw*m.step, th*m.angle, tw, th,
                Math.round(sx-tw/2), Math.round(sy-th), tw, th);
        }else{
            floor.drawImage(tile, Math.round(sx-tile.width/2), Math.round(sy-tile.height));            
        }
        floor.restore()
        // health line
        if(m.health && m.origin_health && m!= hero){
            floor.save()
            floor.globalAlpha=0.7
            if(m.sprite.angles){
                sy-=tile.height/tile.angles;
            }else{
                sy-=m.sprite.height;
            }
            sy+=20;
            var lm=Math.floor(m.origin_health/20),
                lr=Math.floor(m.health/20)
            floor.fillStyle="black"
            floor.fillRect(sx-lm/2-1, sy, lm+2, 6);
            floor.fillStyle="red"
            floor.fillRect(sx-lm/2, sy+1, lr, 4);
            floor.restore()
        }
    }
}//*/

function renderFloor() {
    floor.save();
    floor.translate(floor.w/2-th, floor.h/2);// translate to center
    
    var fdx=Math.floor(hero.x/s), // hero tile
        fdy=Math.floor(hero.y/s),
        miny=Math.max(0, fdy-3), // calculate camera visible tiles
        maxy=Math.min(floorMap.length-1,fdy+3),
        minx=Math.max(0, fdx-3),
        maxx=Math.min(floorMap[0].length-1,fdx+3);
    // translate to hero
    var mrx=hero.x * acos - hero.y * asin,
        mry=hero.x * asin + hero.y * acos;
        mry=mry/2;
    floor.translate(-mrx, -mry);
    // render
    for(var y=miny;y<=maxy;y++){
        for(var x=minx;x<=maxx;x++){
            var f=floorMap[y][x];
            if(f==" ")continue;
            var tile=tileMap[f];
            var tx=( x - y ) * th,
                ty=( x + y ) * th/2;
            floor.drawImage(tile, tx, ty, tw+1, th+1);
        }
    }
    floor.translate(th, 0); // retranslate for diamond textures
    renderObjects();
    floor.restore();
}//*/

function remove(ar,v){var i=ar.indexOf(v);if(i>=0)ar.splice(i,1);}
function randomx(){return Math.floor(Math.random()*(floorMap[0].length/3)*s);}
function randomy(){return Math.floor(Math.random()*(floorMap.length/3)*s);}

function isStep(x,y){
    var dx=Math.floor(x/s), 
        dy=Math.floor(y/s);
    var t = floorMap[dy] ? floorMap[dy][dx] : floorMap[dy];
    return t=="0"||t=="1";
}//*/

function renderLog(){
    floor.save();
    floor.fillStyle='#fff';
    floor.font='10px Arial';
    for(var i in log) floor.fillText(log[i],10,20+(20*i),floor.width-20);
    floor.restore();
}//*/

function Shape(sprite,x,y){
    this.x=x;
    this.y=y;
    this.offset_x=0;
    this.offset_y=0;
    this.sprite=sprite;
    this.isAboveHero=function(){
        var maxlen=tw*1.5;
        if(Math.abs(this.x-hero.x)>maxlen) return false;
        if(Math.abs(this.y-hero.y)>maxlen) return false;
        return true;
    };
}//*/

function House(x,y){
    Shape.call(this,houseSprite,x,y);
    this.offset_y=th/2;
    this.isOverHero=function(){
        var hx=(hero.x - hero.y) * acos,
            hy=(hero.x + hero.y)/2 * asin;
        var sx=(this.x - this.y) * acos,
            sy=(this.x + this.y)/2 * asin;
        return (hx >= sx-houseSprite.width/2)
            && (hx <= sx+houseSprite.width/2)
            && (hy >= sy+this.offset_y-houseSprite.height)
            && (hy <= sy)
    }
}//*/

function Barrel(x, y){
    Shape.call(this,barrelSprite,x,y);
    this.use=function(mob){
        if(mob.doAttack) mob.doAttack(this);
    };
    this.damage=function(damage){
        remove(barrels,this);
        if(Math.random()>0.5)coins.push(new Coin(this.x, this.y));
    };
}//*/

function Coin(x,y){
    Shape.call(this,coinSprite,x,y);
    this.coins=Math.floor(Math.random()*100);
    this.use=function(mob){
        remove(coins,this);
        mob.coins+=this.coins;
        log.push("Found "+this.coins+" coins, now "+mob.coins);
    }
}//*/

function Person(name,x,y){
    this.name=name;
    this.stay=personTextures[this.name].stay;
    this.run=personTextures[this.name].run;
    this.attack=personTextures[this.name].attack;
    this.currentState=this.stay;
    this.step=0;
    Shape.call(this,this.stay[this.a][0],x,y);
    this.to_x=this.x;
    this.to_y=this.y;
    this.nextStep=function(){
        var sx=dx=(this.to_x - this.x),
            sy=dy=(this.to_y - this.y),
            st=6, 
            x=this.x, y=this.y;
        
        if(Math.abs(dx)>st || Math.abs(dy)>st){ 
            sx=st * dx / Math.sqrt((dx*dx) + (dy*dy));
            sy=sx * dy / dx;
        }
        var run=false;
        if(isStep(x+sx,y+sy)){run=true;}
        else if(isStep(this.x,y+sy)){run=true;sx=0;}
        else if(isStep(x+sx,this.y)){run=true;sy=0;}
        
        if(Math.sqrt((sx*sx)+(sy*sy))>5){
            x += sx;
            y += sy;
            if(run){
                this.x=x;
                this.y=y;
                this.setState(this.run);
            }
            else this.setState(this.stay);
            this.rotate(sx,sy);
        }
        else this.setState(this.stay);
        this.step=(this.step+1)%(this.currentState[this.a].length);
        var oldsprite=this.sprite;
        this.sprite=loadImage(this.currentState[this.a][this.step]);
        freeImage(oldsprite);
    }
    this.setState=function(state){
        if(this.currentState!=state){
            this.currentState=state;
            this.step=-1;
        }
    }
    this.rotate = function(sx,sy){
        var l=this.run.length;
        this.a=Math.round((Math.atan2(sy, sx)/Math.PI+2.75)%2*l/2)%l;
    }
    this.rotateTo = function(point){
        this.rotate(point.x-this.x,point.y-this.y);
    }
}//*/

function BasicMob(name,x,y){
    Person.call(this,name,x,y)
    this.origin_health=1000
    this.health=this.origin_health
    this.resistance=10 // damage resistance, less than 1000
    this.use = function(mob){
        if(mob.doAttack) mob.doAttack(this);
    };
    this.damage=function(damage){
        var health=this.health - damage * 1000/(1000-this.resistance);
        if(health<=0){
            this.health=0;
            remove(monsters,this);
            if(Math.random()>0.5) coins.push(new Coin(this.x, this.y));
            log.push(this.name+" is die");
        }else{
            this.health=health;
        }
    }
}

function PeacefullMob(name,x,y){
    this.a=4;
    BasicMob.call(this,name,x,y);
}//*/

function BarbarianOptimized(x,y){
    this.name=name;
    
    this.stay=loadImage("char/barbarian/stay.png", false);
    this.stay.angles=16
    this.stay.steps=8

    this.run=loadImage("char/barbarian/run.png", false);
    this.run.angles=16
    this.run.steps=8
    
    this.attack=loadImage("char/barbarian/push.png", false);
    this.attack.angles=16
    this.attack.steps=10
    
    this.currentState=this.stay;
    this.step=0;
    this.angle=0;
    Shape.call(this, this.currentState, x, y);
    this.rotate = function(sx,sy){
        var l=this.run.angles;
        this.angle=Math.round((Math.atan2(sy, sx)/Math.PI+2.75)*l/2+l/2)%l
    }
    this.rotateTo = function(point){
        this.rotate(point.x-this.x,point.y-this.y);
    }
    this.setState=function(state){
        if(this.currentState!=state){
            this.currentState=state;
            this.step=-1;
        }
    }
    this._nextStep=function(){
        var sx=dx=(this.to_x - this.x),
            sy=dy=(this.to_y - this.y),
            st=16, 
            x=this.x, y=this.y;
        
        if(Math.abs(dx)>st || Math.abs(dy)>st){ 
            sx=st * dx / Math.sqrt((dx*dx) + (dy*dy));
            sy=sx * dy / dx;
        }
        var run=false;
        if(isStep(x+sx,y+sy)){run=true;}
        else if(isStep(this.x,y+sy)){run=true;sx=0;}
        else if(isStep(x+sx,this.y)){run=true;sy=0;}
        
        if(Math.sqrt((sx*sx)+(sy*sy))>5){
            x += sx;
            y += sy;
            if(run){
                this.x=x;
                this.y=y;
                this.setState(this.run);
            }
            else this.setState(this.stay);
            this.rotate(sx,sy);
        }
        else this.setState(this.stay);
        this.step=(this.step+1)%(this.currentState.steps);
        this.sprite=this.currentState;
    }
    this.nextStep=function(){
        if(!this.isAboveHero())return;
        if(this.currentState == this.attack){
            if(this.step==(this.attack.steps-1)){
                this.currentState=this.stay;
                this.step=-1;
                if(this.attacked)this.attacked.damage(this.damages);
            }
            this.step=(this.step+1)%(this.currentState.steps);
            this.sprite=this.currentState;
            this.offset_y=this.currentState==this.attack?35:5
        }else this._nextStep();
    }
    this.origin_health=1000
    this.health=this.origin_health
    this.resistance=10 // damage resistance, less than 1000
    this.damages=100
    this.doAttack=function(mob){
        this.rotateTo(mob);
        this.setState(this.attack);
        this.attacked=mob;
    };
    this.use = function(mob){
        if(mob.doAttack) mob.doAttack(this);
    };
    this.damage=function(damage){
        var health=this.health - damage * 1000/(1000-this.resistance);
        if(health<=0){
            this.health=0;
            remove(monsters,this);
            if(Math.random()>0.5) coins.push(new Coin(this.x, this.y));
            log.push(this.name+" is die");
        }else{
            this.health=health;
        }
    }
}

})();
