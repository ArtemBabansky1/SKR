document.body.classList.remove('no-js');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
gsap.registerPlugin(ScrollTrigger);

/* ============ smooth scroll ============ */
let lenis;
if(!reduce){
  lenis=new Lenis({duration:1.15,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
  lenis.on('scroll',ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{const id=a.getAttribute('href');
    if(id.length>1){const el=document.querySelector(id);
      if(el){e.preventDefault();lenis?lenis.scrollTo(el,{offset:0}):el.scrollIntoView({behavior:'smooth'});closeMenu();}}});
});

/* ============ custom cursor ============ */
if(fine&&!reduce){
  const dot=document.querySelector('.cur'),ring=document.querySelector('.cur-ring');
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;gsap.set(dot,{x:mx,y:my});});
  (function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;gsap.set(ring,{x:rx,y:ry});requestAnimationFrame(loop);})();
  const hov=()=>document.body.classList.add('cur-hov'),out=()=>document.body.classList.remove('cur-hov');
  document.querySelectorAll('.cursor-target,a,button,summary').forEach(el=>{el.addEventListener('mouseenter',hov);el.addEventListener('mouseleave',out);});
}

/* ============ GLOBAL: page transitions (veil on exit) ============ */
const veil=document.createElement('div');
veil.className='veil';veil.setAttribute('aria-hidden','true');
document.body.appendChild(veil);
if(!reduce){
  document.querySelectorAll('a[href]').forEach(a=>{
    const h=a.getAttribute('href')||'';
    if(!/^(https?:|mailto:|tel:|#)/.test(h)&&/\.html(#|$)/.test(h)){
      a.addEventListener('click',e=>{
        if(e.metaKey||e.ctrlKey||e.shiftKey||a.target==='_blank')return;
        e.preventDefault();
        gsap.to(veil,{y:0,duration:.45,ease:'expo.inOut',startAt:{y:'101%'},onComplete:()=>{location.href=h;}});
      });
    }
  });
  addEventListener('pageshow',e=>{if(e.persisted)gsap.set(veil,{y:'101%'});});
}

/* ============ GLOBAL: scroll progress hairline ============ */
if(!reduce){
  const bar=document.createElement('div');
  bar.className='progress-line';bar.setAttribute('aria-hidden','true');
  document.body.appendChild(bar);
  gsap.to(bar,{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.3}});
}

/* ============ GLOBAL: header hides on scroll down, returns on scroll up ============ */
if(!reduce){
  const hdr=document.querySelector('.hdr');
  ScrollTrigger.create({start:0,end:'max',
    onUpdate:s=>{
      if(document.getElementById('mm')?.classList.contains('open'))return;
      if(s.direction===1&&s.scroll()>160)gsap.to(hdr,{yPercent:-110,duration:.5,ease:'expo.out',overwrite:'auto'});
      else if(s.direction===-1)gsap.to(hdr,{yPercent:0,duration:.5,ease:'expo.out',overwrite:'auto'});
    }});
}

/* ============ hero masked reveal ============ */
const heroRows=document.querySelectorAll('[data-hero] .row i');
if(heroRows.length){
  if(!reduce){
    gsap.set(heroRows,{yPercent:118});
    const tl=gsap.timeline({delay:.12,defaults:{ease:'expo.out'}});
    tl.to(heroRows,{yPercent:0,duration:1.2,stagger:.1});
    gsap.set('.hero [data-fade]',{y:28,opacity:0});
    tl.to('.hero [data-fade]',{y:0,opacity:1,duration:1,stagger:.12},'-=0.65');
    gsap.from('.hdr',{y:-28,opacity:0,duration:1,ease:'expo.out',delay:.1});
  }else{gsap.set(heroRows,{yPercent:0});gsap.set('.hero [data-fade]',{opacity:1});}
}

/* ============ TEXT: word-by-word serif statements (scrub) ============ */
if(window.Splitting){
  document.querySelectorAll('[data-words]').forEach(el=>{
    Splitting({target:el,by:'words'});
    const words=el.querySelectorAll('.word');
    if(reduce){gsap.set(words,{opacity:1});return;}
    gsap.set(words,{opacity:.12});
    gsap.to(words,{opacity:1,stagger:.05,ease:'none',
      scrollTrigger:{trigger:el,start:'top 80%',end:'bottom 62%',scrub:.6}});
  });
}

/* ============ TEXT: word-cascade reveals for titles (blur + rise) ============ */
if(window.Splitting&&!reduce){
  document.querySelectorAll('.cta__h,.hp__intro h2,.p-hero h1,.doc h2,.pd__head .pcard__t').forEach(el=>{
    Splitting({target:el,by:'words'});
    const words=el.querySelectorAll('.word');
    if(!words.length)return;
    gsap.fromTo(words,
      {opacity:0,y:26,filter:'blur(8px)'},
      {opacity:1,y:0,filter:'blur(0px)',duration:.9,ease:'expo.out',stagger:.055,
       scrollTrigger:{trigger:el,start:'top 90%',once:true}});
  });
  document.querySelectorAll('.ct__sub,.ct__lead,.pdo-k').forEach(el=>{
    gsap.fromTo(el,{opacity:0,y:20},{opacity:1,y:0,duration:.9,ease:'expo.out',
      scrollTrigger:{trigger:el,start:'top 92%',once:true}});
  });
}

/* ============ BLOCKS: generic fade-ups (rows, cards and lists get their own choreography) ============ */
if(!reduce){
  gsap.utils.toArray('[data-fade]').forEach(el=>{
    if(el.closest('.hero'))return;
    if(el.classList.contains('vrow')||el.classList.contains('mem')||el.classList.contains('fact')||el.classList.contains('team-photo'))return;
    gsap.fromTo(el,{y:32,opacity:0},{y:0,opacity:1,duration:1,ease:'expo.out',
      scrollTrigger:{trigger:el,start:'top 90%'}});
  });
}else{gsap.set('[data-fade]',{opacity:1});}

/* ============ BLOCKS: value/process rows — row rises, children cascade ============ */
if(!reduce){
  gsap.utils.toArray('.vrow').forEach(row=>{
    const kids=row.querySelectorAll('.vn,.vt,.vd,.va');
    const tl=gsap.timeline({scrollTrigger:{trigger:row,start:'top 90%',once:true}});
    tl.fromTo(row,{opacity:0},{opacity:1,duration:.5,ease:'none'},0)
      .fromTo(kids,{y:30,opacity:0},{y:0,opacity:1,duration:.9,ease:'expo.out',stagger:.09},0);
  });
}

/* ============ BLOCKS: facts — rise + line draw + counters ============ */
if(!reduce){
  gsap.utils.toArray('.fact').forEach((f,i)=>{
    gsap.fromTo(f,{y:34,opacity:0},{y:0,opacity:1,duration:1,ease:'expo.out',delay:(i%5)*.08,
      scrollTrigger:{trigger:f,start:'top 92%',once:true}});
  });
  document.querySelectorAll('.fact__n').forEach(n=>{
    const tpl=n.innerHTML;
    const m=n.textContent.match(/\d+/);
    if(!m)return;
    const target=+m[0],obj={v:0};
    gsap.to(obj,{v:target,duration:1.8,ease:'expo.out',
      scrollTrigger:{trigger:n,start:'top 92%',once:true},
      onUpdate:()=>{n.innerHTML=tpl.replace(m[0],String(Math.round(obj.v)));},
      onComplete:()=>{n.innerHTML=tpl;}});
  });
}

/* ============ BLOCKS: team cards — clip reveal + photo settle + caption cascade ============ */
if(!reduce){
  gsap.utils.toArray('.mem').forEach((card,i)=>{
    const img=card.querySelector('.mem__img'),pic=card.querySelector('.mem__img img'),
          cap=card.querySelectorAll('figcaption > *');
    const tl=gsap.timeline({scrollTrigger:{trigger:card,start:'top 88%',once:true},defaults:{ease:'expo.out'}});
    tl.set(card,{opacity:1})
      .fromTo(img,{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0% 0 0 0)',duration:1.1,delay:(i%4)*.1},0)
      .fromTo(pic,{scale:1.25},{scale:1,duration:1.4},0)
      .fromTo(cap,{y:22,opacity:0},{y:0,opacity:1,duration:.8,stagger:.08},.35);
  });
  const tp=document.querySelector('.team-photo');
  if(tp){
    const ph=tp.querySelector('.ph'),img=tp.querySelector('img'),cap=tp.querySelector('figcaption');
    const tl=gsap.timeline({scrollTrigger:{trigger:tp,start:'top 85%',once:true},defaults:{ease:'expo.out'}});
    tl.set(tp,{opacity:1})
      .fromTo(ph,{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:1.3},0)
      .fromTo(img,{scale:1.2},{scale:1,duration:1.6},0)
      .fromTo(cap,{opacity:0,y:14},{opacity:1,y:0,duration:.7},.5);
    gsap.fromTo(img,{yPercent:-6},{yPercent:6,ease:'none',
      scrollTrigger:{trigger:tp,start:'top bottom',end:'bottom top',scrub:.4}});
  }
  gsap.utils.toArray('.mem__img img').forEach(img=>{
    gsap.fromTo(img,{yPercent:-4},{yPercent:4,ease:'none',
      scrollTrigger:{trigger:img.closest('.mem'),start:'top bottom',end:'bottom top',scrub:.4}});
  });
}

/* ============ BLOCKS: practice details — head slides, list items cascade ============ */
if(!reduce){
  gsap.utils.toArray('.pdetail').forEach(d=>{
    const head=d.querySelectorAll('.pd__head > *'),body=d.querySelector('.pcard__d'),items=d.querySelectorAll('.pdo li');
    const tl=gsap.timeline({scrollTrigger:{trigger:d,start:'top 85%',once:true},defaults:{ease:'expo.out'}});
    tl.fromTo(head,{y:34,opacity:0},{y:0,opacity:1,duration:.9,stagger:.1},0);
    if(body)tl.fromTo(body,{y:26,opacity:0},{y:0,opacity:1,duration:.9},.15);
    if(items.length)tl.fromTo(items,{x:-18,opacity:0},{x:0,opacity:1,duration:.7,stagger:.06},.3);
  });
}

/* ============ practices: pinned horizontal + ghost parallax / static fallback ============ */
const hp=document.getElementById('hp'),track=document.getElementById('hpTrack'),prog=document.getElementById('hpProg');
if(hp&&track){
  if(!reduce&&matchMedia('(min-width:881px)').matches){
    const dist=()=>track.scrollWidth-innerWidth;
    const move=gsap.to(track,{x:()=>-dist(),ease:'none',
      scrollTrigger:{trigger:hp,start:'top top',end:()=>'+='+dist(),pin:true,scrub:.8,invalidateOnRefresh:true,
        onUpdate:s=>{if(prog)prog.style.width=(s.progress*100)+'%';}}});
    gsap.utils.toArray('.pcard__ghost').forEach(g=>{
      gsap.fromTo(g,{xPercent:30},{xPercent:-30,ease:'none',
        scrollTrigger:{trigger:g.closest('.pcard'),containerAnimation:move,start:'left right',end:'right left',scrub:true}});
    });
    gsap.utils.toArray('.pcard').forEach(c=>{
      gsap.fromTo(c.querySelectorAll('.pcard__n,.pcard__t,.pcard__d,.pcard__tags'),
        {y:30,opacity:0},{y:0,opacity:1,duration:.8,ease:'expo.out',stagger:.07,
         scrollTrigger:{trigger:c,containerAnimation:move,start:'left 85%',once:true}});
    });
  }else if(reduce){
    hp.classList.add('hp--static');
  }
}

/* ============ magnetic buttons ============ */
if(fine&&!reduce){
  document.querySelectorAll('.btn').forEach(b=>{
    b.addEventListener('mousemove',e=>{
      const r=b.getBoundingClientRect();
      gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.22,y:(e.clientY-r.top-r.height/2)*.28,duration:.5,ease:'power3.out'});
    });
    b.addEventListener('mouseleave',()=>gsap.to(b,{x:0,y:0,duration:.7,ease:'elastic.out(1,.45)'}));
  });
}

/* ============ FAQ: smooth unfold ============ */
document.querySelectorAll('details.faq').forEach(d=>{
  d.addEventListener('toggle',()=>{
    if(d.open&&!reduce){
      const a=d.querySelector('.fq-a');
      if(a)gsap.fromTo(a,{height:0,opacity:0,y:10},{height:'auto',opacity:1,y:0,duration:.55,ease:'expo.out',clearProps:'height'});
    }
  });
});

ScrollTrigger.refresh();
addEventListener('load',()=>ScrollTrigger.refresh());

/* ============ mobile menu (staggered links) ============ */
const mm=document.getElementById('mm');
function closeMenu(){if(mm)mm.classList.remove('open');}
const burger=document.getElementById('burger');
if(burger)burger.addEventListener('click',()=>{
  mm.classList.add('open');
  if(!reduce)gsap.fromTo('#mm nav a',{y:34,opacity:0},{y:0,opacity:1,duration:.7,ease:'expo.out',stagger:.07,delay:.25});
});
const mmx=document.getElementById('mmx');
if(mmx)mmx.addEventListener('click',closeMenu);
document.querySelectorAll('.mlink').forEach(a=>a.addEventListener('click',closeMenu));

/* ============ lead form -> честное письмо через почтовый клиент (без сторонних релеев) ============ */
const lead=document.getElementById('leadForm');
if(lead){
  lead.addEventListener('submit',e=>{
    e.preventDefault();
    const agree=document.getElementById('f-agree');
    const box=lead.querySelector('.consent');
    const hint=lead.querySelector('.form__hint');
    if(agree&&!agree.checked){
      if(box)box.classList.add('err');
      if(hint)hint.textContent='Чтобы отправить заявку, подтвердите согласие на обработку персональных данных.';
      return;
    }
    if(box)box.classList.remove('err');
    const name=(document.getElementById('f-name').value||'').trim();
    const phone=(document.getElementById('f-phone').value||'').trim();
    const msg=(document.getElementById('f-msg').value||'').trim();
    const body='Имя: '+name+'\nТелефон: '+phone+'\n\nСитуация:\n'+msg+'\n\n— заявка с сайта СКР';
    location.href='mailto:hello@skr.law?subject='+encodeURIComponent('Заявка на консультацию — сайт СКР')+'&body='+encodeURIComponent(body);
    if(hint)hint.textContent='Открываем вашу почтовую программу — письмо сформировано, остаётся нажать «Отправить». Или позвоните: +7 (495) 123-45-67.';
  });
}

/* ============ digest -> подписка письмом ============ */
const news=document.getElementById('newsForm');
if(news){
  news.addEventListener('submit',e=>{
    e.preventDefault();
    const em=(news.querySelector('input').value||'').trim();
    location.href='mailto:hello@skr.law?subject='+encodeURIComponent('Подписка на дайджест СКР')+'&body='+encodeURIComponent('Прошу подписать меня на дайджест. E-mail: '+em);
  });
}

const ta=document.getElementById('f-msg');
if(ta)ta.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';});
