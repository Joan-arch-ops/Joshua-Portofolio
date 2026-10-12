/* ===== OPENING "Data": data mentah -> bersih -> klaster -> kurva tren -> logo Z -> tulisan "Joshua" =====
   Canvas 2D murni, tanpa library, tanpa tombol skip. Berpasangan dengan css/opening.css dan skrip kecil di <head> index.html.
   Fungsi dataOpening() adalah kode referensi yang sama dengan prototipe (jumlah titik, durasi, tahap, easing, warna tidak diubah);
   satu-satunya penyesuaian ada pada pembuat titik tujuan nama (ditandai "INTEGRASI").

   Cara memutar ulang: Ctrl+K -> "Putar ulang opening", atau tambah ?opening di URL. Matikan sementara: ?noopening.
   Hanya sekali per sesi tab: atur ONCE di <head> index.html. */
(() => {
  'use strict';

  async function dataOpening(ov,nm,alive){
    const cv=document.createElement('canvas');cv.style.cssText='position:absolute;inset:0;width:100%;height:100%';ov.append(cv);
    const dpr=Math.min(devicePixelRatio||1,2),W=innerWidth,H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;
    const c=cv.getContext('2d');c.scale(dpr,dpr);
    const rnd=Math.random,cl=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),sm=u=>u*u*(3-2*u),gs=()=>Math.sqrt(-2*Math.log(rnd()+1e-9))*Math.cos(6.283*rnd());
    const N=W<640?1500:2480,K=5,NO=Math.round(N*.08),M=N-NO,T=10.6,SG=Math.min(W,H)*.06;
    const X0=W*.1,PW=W*.82,Y0=H*.15,PH=H*.63,Y1=Y0+PH;
    const PAL=['#5b9bff','#8fb8ff','#4f8cff','#c4daff','#7a8cff','#a3c4ff','#ff5d5d'];
    const ST=['memuat dataset…','membersihkan outlier…','mengelompokkan · k = 5','mencocokkan kurva tren','menyusun logo','merender nama'];
    const phOf=v=>v>=8.4?5:v>=6.2?4:v>=4.8?3:v>=3?2:v>=1.8?1:0;
    /* sampler titik dari bentuk (merata, lalu diacak) */
    const pick=(draw,n)=>{const oc=document.createElement('canvas');oc.width=W;oc.height=H;const o=oc.getContext('2d',{willReadFrequently:true});draw(o);
      const d=o.getImageData(0,0,W,H).data,a=[];for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2)if(d[(y*W+x)*4+3]>128)a.push([x,y]);
      const r=[];for(let i=0;i<n;i++){const q=a[i*a.length/n|0];r.push([q[0]+rnd()*2,q[1]+rnd()*2])}
      for(let i=n-1;i>0;i--){const j=rnd()*(i+1)|0;[r[i],r[j]]=[r[j],r[i]]}return r};
    /* logo: 12 titik sudut dalam kotak 404 x 734 */
    const LP=[[0,0],[404,0],[106,667],[298,667],[239,529],[274,446],[404,734],[0,734],[298,67],[105,67],[165,205],[130,288]];
    const LH=Math.min(H*.6,W*.72*734/404),S=LH/734,LW=404*S,OX=W/2-LW/2,OY=H*.47-LH/2;
    const lp=new Path2D();LP.forEach(([x,y],i)=>lp[i?'lineTo':'moveTo'](OX+x*S,OY+y*S));lp.closePath();
    let per=0;LP.forEach((q,i)=>{const n=LP[(i+1)%12];per+=Math.hypot(n[0]-q[0],n[1]-q[1])});per*=S;
    const r=nm.getBoundingClientRect(),cs=getComputedStyle(nm);
    const LT=pick(o=>o.fill(lp),M);
    /* INTEGRASI: nama di hero ini dibangun per huruf (.l > .lg) dengan padding dan letter-spacing negatif, jadi menggambar
       seluruh teks sekaligus akan bergeser dari teks asli. Di sini tiap huruf digambar tepat di kotak .lg miliknya
       (baseline dihitung dari metrik font + line-height). Kalau elemen tidak punya struktur itu, dipakai cara asli. */
    const NT=pick(o=>{
      const gl=[...nm.querySelectorAll('.lg')];
      if(!gl.length){o.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;o.textAlign='center';o.textBaseline='middle';
        if('letterSpacing' in o)o.letterSpacing=cs.letterSpacing;o.fillText(nm.textContent,r.left+r.width/2,r.top+r.height/2);return}
      gl.forEach(g=>{
        const ch=g.textContent;if(!ch.trim())return;
        const s=getComputedStyle(g),b=g.getBoundingClientRect();
        o.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;o.textAlign='left';
        if('letterSpacing' in o)o.letterSpacing='0px';
        const m=o.measureText(ch);
        if(m.fontBoundingBoxAscent!=null){o.textBaseline='alphabetic';o.fillText(ch,b.left,b.top+(b.height-(m.fontBoundingBoxAscent+m.fontBoundingBoxDescent))/2+m.fontBoundingBoxAscent)}
        else{o.textBaseline='middle';o.fillText(ch,b.left,b.top+b.height/2)}
      })},M);
    /* klaster */
    const FIN=[[.2,.3],[.5,.22],[.8,.34],[.32,.7],[.7,.72]].map(([a,b])=>[X0+a*PW,Y0+b*PH]);
    const INI=FIN.map(()=>[X0+rnd()*PW,Y0+rnd()*PH]);
    const cen=(j,t)=>{const e=sm(cl((t-3)/1.4));return[INI[j][0]+(FIN[j][0]-INI[j][0])*e,INI[j][1]+(FIN[j][1]-INI[j][1])*e]};
    const CY=u=>Y1-PH*(.08+.76*sm(u)+.05*Math.sin(u*7));
    const P=[];
    for(let i=0;i<N;i++){
      const o=i<NO,a=rnd()*6.283;
      const p={o,vx:0,vy:0,d:rnd(),kv:.75+rnd()*.5,s:rnd()<.5?-1:1,r:.9+rnd()*1.1,cb:rnd()<.18?3:0,ph:rnd()*6.283,gx:cl(gs(),-2,2),gy:cl(gs(),-2,2),u:rnd(),dead:false,ci:0,al:1,k:0};
      p.bx=o?cl(W/2+Math.cos(a)*W*.47,8,W-8):X0+rnd()*PW;p.by=o?cl(H/2+Math.sin(a)*H*.43,8,H-8):Y0+rnd()*PH;
      p.x=p.bx;p.y=p.by;
      let b=1e9;FIN.forEach((f,j)=>{const dd=Math.hypot(f[0]-p.bx,f[1]-p.by);if(dd<b){b=dd;p.k=j}});
      if(!o){const q=LT[i-NO],m=NT[i-NO];p.lx=q[0];p.ly=q[1];p.nx=m[0];p.ny=m[1];p.low=p.ly>OY+LH/2}
      P.push(p);
    }
    const D=40,cols=Math.ceil(W/D)+1,rws=Math.ceil(H/D)+1,hd=new Int32Array(cols*rws),nxt=new Int32Array(N);
    const MONO='600 12px ui-monospace,Menlo,Consolas,monospace';
    const TS=[0,1.8,3,4.8,6.2,8.4];let bb=0; /* TS = awal tiap tahap; bb = waktu denyut cincin logo */
    await new Promise((res,rej)=>{
      const t0=performance.now();let last=t0;
      const f=now=>{
        if(!alive())return rej('x');
        const t=Math.max(0,(now-t0)/1000),dt=cl((now-last)/1000,.001,.034);last=now;
        const SWX=X0+PW*sm(cl((t-4.8)/1.3)),ga=cl(t/.6);
        /* simulasi: pegas teredam + gaya putar supaya lintasan melengkung */
        for(const p of P){
          if(p.dead)continue;
          const tp=t-p.d*.5,q=phOf(tp);
          const fx=p.bx+14*Math.sin(p.by*.012+t*.9+p.ph),fy=p.by+14*Math.cos(p.bx*.012+t*.8+p.ph);
          let tx,ty,k=3,cu=0,ci=p.cb;
          if(p.o&&q>=1){
            ci=6;
            if(tp<2.5){tx=fx;ty=fy;p.al=.35+.65*Math.abs(Math.sin(t*22))}
            else{const a=Math.atan2(p.y-H/2,p.x-W/2);tx=p.x+Math.cos(a)*400;ty=p.y+Math.sin(a)*400;k=5;cu=.25;p.al=1}
          }else if(q<=1){tx=fx;ty=fy}
          else if(q<=3){
            const cx=X0+p.u*PW;
            if(q===3&&SWX>=cx){tx=cx+p.gy*3;ty=CY(p.u)+p.gx*7;k=14;cu=.2}
            else{const c2=cen(p.k,t);tx=c2[0]+p.gx*SG;ty=c2[1]+p.gy*SG;k=12;cu=.25}
            ci=p.k;
          }else if(q===4){
            if(p.low&&tp<6.75){tx=W/2+p.gx*5;ty=OY+LH/2+p.gy*5;k=10}else{tx=p.lx;ty=p.ly;k=20}
            cu=.28;
          }else{tx=p.nx;ty=p.ny;k=16;cu=.22}
          const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1,kk=k*p.kv,cd=1.8*Math.sqrt(kk),fc=Math.min(d,180)*kk*cu*p.s;
          p.vx+=(kk*dx-cd*p.vx-dy/d*fc)*dt;p.vy+=(kk*dy-cd*p.vy+dx/d*fc)*dt;
          p.x+=p.vx*dt;p.y+=p.vy*dt;p.ci=ci;
          if(p.o&&tp>2.5&&(p.x<-30||p.x>W+30||p.y<-30||p.y>H+30))p.dead=true;
        }
        /* gambar */
        c.clearRect(0,0,W,H);
        const ax=t<4.8?1:cl(1-(t-4.8)/1.2);
        if(ax>0){
          c.globalAlpha=ax;c.lineWidth=1;c.strokeStyle='rgba(137,149,175,.13)';c.beginPath();
          for(let i=0;i<=8;i++){const x=X0+PW*i/8;c.moveTo(x,Y1+6);c.lineTo(x,Y1+6-(PH+6)*sm(cl(t/1.4-i*.03)))}
          for(let i=0;i<=5;i++){const y=Y0+PH*i/5;c.moveTo(X0-6,y);c.lineTo(X0-6+(PW+6)*sm(cl(t/1.4-i*.04)),y)}
          c.stroke();c.strokeStyle='rgba(137,149,175,.7)';c.beginPath();c.moveTo(X0,Y1-PH*sm(cl(t/1.2)));c.lineTo(X0,Y1);c.lineTo(X0+PW*sm(cl((t-.2)/1.2)),Y1);c.stroke();
        }
        const rows=N-Math.round(NO*sm(cl((t-2.4)/.9))),ph=phOf(t);
        if(!bb&&t>7.9)bb=t;
        if(bb){const u=(t-bb)/1.3;if(u<1){c.save();c.globalAlpha=(1-u)*.4;c.strokeStyle='#9cc2ff';c.lineWidth=1.2;c.beginPath();c.arc(W/2,OY+LH/2,LH*.35+sm(u)*Math.max(W,H)*.45,0,6.283);c.stroke();c.restore()}}
        c.globalAlpha=ga;c.font=MONO;c.textBaseline='alphabetic';
        c.fillStyle='#eef3ff';c.fillText('dataset.csv · '+rows.toLocaleString('id-ID')+' baris',X0,Y0-40);
        {const pa=sm(cl((t-TS[ph])/.45));c.globalAlpha=ga*pa;c.fillStyle='#8995af';c.fillText('› '+ST[ph]+(t%.9<.5?'_':''),X0,Y0-22+(1-pa)*7);c.globalAlpha=ga}
        c.fillStyle='#1b2740';c.fillRect(X0,Y0-10,PW,2);c.fillStyle='#4f8cff';c.fillRect(X0,Y0-10,PW*cl(t/T),2);c.fillStyle='#eef3ff';c.fillRect(X0+PW*cl(t/T)-1.5,Y0-11.5,3,5);
        const ka=cl((t-3)/.4)*(t<4.8?1:cl(1-(t-4.8)/.6));
        if(ka>0)for(let j=0;j<K;j++){
          const [cx,cy]=cen(j,t),rr=9+4*Math.sin(t*5+j);
          c.globalAlpha=ka*.9;c.strokeStyle=PAL[j];c.lineWidth=1.5;c.beginPath();c.arc(cx,cy,rr,0,6.283);
          c.moveTo(cx-rr-5,cy);c.lineTo(cx+rr+5,cy);c.moveTo(cx,cy-rr-5);c.lineTo(cx,cy+rr+5);c.stroke();
        }
        if(t>4.8&&t<7){
          const uS=cl((SWX-X0)/PW),n=70;c.save();c.globalAlpha=t<6.2?1:cl(1-(t-6.2)/.8);
          c.shadowColor='#4f8cff';c.shadowBlur=14;c.strokeStyle='#c4daff';c.lineWidth=2;c.lineJoin='round';c.beginPath();
          for(let i=0;i<=n;i++){const u=uS*i/n;c[i?'lineTo':'moveTo'](X0+u*PW,CY(u))}c.stroke();
          c.fillStyle='#fff';c.beginPath();c.arc(X0+uS*PW,CY(uS),3.5,0,6.283);c.fill();c.restore();
        }
        c.globalAlpha=ga;
        for(let ci=0;ci<6;ci++){c.fillStyle=PAL[ci];c.beginPath();for(const p of P)if(!p.dead&&p.ci===ci){c.moveTo(p.x+p.r,p.y);c.arc(p.x,p.y,p.r,0,6.283)}c.fill()}
        c.fillStyle=PAL[6];for(const p of P)if(p.o&&!p.dead&&p.ci===6){c.globalAlpha=ga*p.al;c.fillRect(p.x-p.r*1.2,p.y-p.r*1.2,p.r*2.4,p.r*2.4)}
        /* logo: isi, outline bercahaya, kilau sekali */
        const op=cl((t-7.1)/.9),fo=t<8.3?1:cl(1-(t-8.3)/.5);
        if(op>0&&fo>0){
          c.save();c.globalAlpha=fo*cl((t-7)/.8);c.fillStyle='rgba(91,155,255,.14)';c.fill(lp);
          c.globalAlpha=fo;c.shadowColor='#4f8cff';c.shadowBlur=18;c.strokeStyle='#e6efff';c.lineWidth=2;c.lineJoin='miter';c.setLineDash([per*sm(op),per]);c.stroke(lp);c.restore();
          const sh=cl((t-7.9)/.7);
          if(sh>0&&sh<1){
            c.save();c.clip(lp);const gx=OX-LW*.6+LW*2.2*sm(sh),gr=c.createLinearGradient(gx-70,OY,gx+70,OY+LH*.4);
            gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.65)');gr.addColorStop(1,'rgba(255,255,255,0)');
            c.globalAlpha=fo;c.fillStyle=gr;c.fillRect(OX-20,OY-20,LW+40,LH+40);c.restore();
          }
        }
        /* konstelasi: garis tipis antar titik berdekatan (grid spasial) */
        const ca=cl((t-9)/.6)*(t<10?1:cl(1-(t-10)/.5));
        if(ca>.01){
          hd.fill(-1);
          for(let i=NO;i<N;i++){const p=P[i],cx=cl(p.x/D|0,0,cols-1),cy=cl(p.y/D|0,0,rws-1),h=cy*cols+cx;nxt[i]=hd[h];hd[h]=i}
          c.globalAlpha=ca*.35;c.strokeStyle='#8fb8ff';c.lineWidth=.6;c.beginPath();
          for(let i=NO;i<N;i+=3){
            const p=P[i],cx=p.x/D|0,cy=p.y/D|0;let n=0;
            for(let yy=cy-1;yy<=cy+1&&n<3;yy++)for(let xx=cx-1;xx<=cx+1&&n<3;xx++){
              if(xx<0||yy<0||xx>=cols||yy>=rws)continue;
              for(let j=hd[yy*cols+xx];j>=0&&n<3;j=nxt[j]){if(j===i)continue;const q=P[j],dd=Math.hypot(q.x-p.x,q.y-p.y);if(dd>9&&dd<D){c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);n++}}
            }
          }
          c.stroke();
        }
        c.globalAlpha=1;
        t>=T?res():requestAnimationFrame(f);
      };requestAnimationFrame(f);
    });
  }

  const NAME_SELECTOR = '.name'; // <h1 class="name"> "Joshua" di hero
  const root = document.documentElement;
  const holdName = () => (window.__nameHold = Infinity); // nama jangan berputar ke "Zyhco" selama opening
  const releaseName = () => (window.__nameHold = performance.now() + 2600);

  // animasi masuk hero: kelas opening-on (penahan) dilepas bersamaan dengan overlay mulai memudar (crossfade 0,7 dtk)
  const showHero = () => {
    root.classList.add('opening-played');
    root.classList.remove('opening-on');
  };

  window.playIntro = () => {
    try {
      sessionStorage.removeItem('opening-seen');
      sessionStorage.setItem('opening-force', '1');
    } catch (e) {}
    location.reload();
  };

  (async () => {
    const ov = document.getElementById('opening'),
      nm = document.querySelector(NAME_SELECTOR);
    // keputusan main/lewati sudah dibuat skrip di <head> (kelas opening-on dipasang sebelum cat pertama)
    if (!ov || !root.classList.contains('opening-on')) {
      if (ov) ov.remove();
      root.classList.remove('opening-on');
      return;
    }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clear = () => {
      root.classList.remove('opening-on');
      setTimeout(() => ov.remove(), 800);
    };
    if (!nm || reduce) {
      ov.classList.add('out');
      showHero();
      clear();
      return;
    }

    holdName();
    // halaman terkunci selama opening: tanpa scroll, tanpa fokus/klik ke konten di belakang
    const blockable = [...document.body.children].filter((el) => el !== ov && el.tagName !== 'SCRIPT');
    blockable.forEach((el) => (el.inert = true));
    const stop = (e) => e.preventDefault();
    const toTop = () => scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const onKey = (e) => {
      const k = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'k') {
        e.preventDefault();
        e.stopPropagation(); // palet perintah tidak boleh terbuka di atas opening
      } else if ([' ', 'arrowup', 'arrowdown', 'pageup', 'pagedown', 'home', 'end'].includes(k)) e.preventDefault();
    };
    ov.addEventListener('wheel', stop, { passive: false }); // juga mencegah smooth-scroll.js menggulir halaman
    ov.addEventListener('touchmove', stop, { passive: false });
    addEventListener('keydown', onKey, true);
    addEventListener('scroll', toTop, { passive: true });
    toTop();

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      removeEventListener('keydown', onKey, true);
      removeEventListener('scroll', toTop);
      ov.classList.add('out');
      showHero();
      clear(); // crossfade 0,7 dtk: overlay memudar, hero masuk
      blockable.forEach((el) => (el.inert = false));
      releaseName();
    };
    const safety = setTimeout(close, 20000); // jaring pengaman bila animasi macet

    try {
      // pastikan font nama benar-benar termuat sebelum ukurannya dibaca (fonts.ready saja bisa selesai sebelum font diminta)
      const cs = getComputedStyle(nm);
      await Promise.race([
        document.fonts.load(`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, nm.textContent).catch(() => {}),
        new Promise((r) => setTimeout(r, 5000)),
      ]);
      await document.fonts.ready;
      toTop();
      await dataOpening(ov, nm, () => true);
      try {
        sessionStorage.setItem('opening-seen', '1');
      } catch (e) {}
    } catch (e) {
      console.error(e);
    }
    clearTimeout(safety);
    close();
  })();
})();
