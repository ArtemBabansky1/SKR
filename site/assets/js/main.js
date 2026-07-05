document.body.classList.remove('no-js');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
gsap.registerPlugin(ScrollTrigger);

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

if(fine&&!reduce){
  const dot=document.querySelector('.cur'),ring=document.querySelector('.cur-ring');
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;gsap.set(dot,{x:mx,y:my});});
  (function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;gsap.set(ring,{x:rx,y:ry});requestAnimationFrame(loop);})();
  const hov=()=>document.body.classList.add('cur-hov'),out=()=>document.body.classList.remove('cur-hov');
  document.querySelectorAll('.cursor-target,a,button,summary').forEach(el=>{el.addEventListener('mouseenter',hov);el.addEventListener('mouseleave',out);});
}

/* hero masked reveal */
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

/* word-by-word serif statements */
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

/* generic fade-ups */
if(!reduce){
  gsap.utils.toArray('[data-fade]').forEach(el=>{
    if(el.closest('.hero'))return;
    gsap.fromTo(el,{y:32,opacity:0},{y:0,opacity:1,duration:1,ease:'expo.out',
      scrollTrigger:{trigger:el,start:'top 90%'}});
  });
}else{gsap.set('[data-fade]',{opacity:1});}

/* practices: pinned horizontal (desktop) / static fallback (reduced motion) */
const hp=document.getElementById('hp'),track=document.getElementById('hpTrack'),prog=document.getElementById('hpProg');
if(hp&&track){
  if(!reduce&&matchMedia('(min-width:881px)').matches){
    const dist=()=>track.scrollWidth-innerWidth;
    gsap.to(track,{x:()=>-dist(),ease:'none',
      scrollTrigger:{trigger:hp,start:'top top',end:()=>'+='+dist(),pin:true,scrub:.8,invalidateOnRefresh:true,
        onUpdate:s=>{if(prog)prog.style.width=(s.progress*100)+'%';}}});
  }else if(reduce){
    hp.classList.add('hp--static');
  }
}

ScrollTrigger.refresh();
addEventListener('load',()=>ScrollTrigger.refresh());

/* mobile menu */
const mm=document.getElementById('mm');
function closeMenu(){if(mm)mm.classList.remove('open');}
const burger=document.getElementById('burger');
if(burger)burger.addEventListener('click',()=>mm.classList.add('open'));
const mmx=document.getElementById('mmx');
if(mmx)mmx.addEventListener('click',closeMenu);
document.querySelectorAll('.mlink').forEach(a=>a.addEventListener('click',closeMenu));

/* lead form -> честное письмо через почтовый клиент (без сторонних релеев) */
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

/* digest -> подписка письмом */
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
