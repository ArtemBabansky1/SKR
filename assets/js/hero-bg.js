/* ============================================================
   HERO BACKGROUND — slow-flowing monochrome abstraction (WebGL)
   Recreates the grainy black&white "smoke/silk" reference:
   domain-warped fbm noise (liquify + flow field) + film grain.
   Vanilla WebGL, no dependencies. Static fallback if unavailable.
   ============================================================ */
(function(){
  const canvas=document.getElementById('heroBg');
  if(!canvas)return;

  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl=canvas.getContext('webgl',{antialias:false,alpha:false,powerPreference:'low-power'});
  if(!gl){canvas.style.background='radial-gradient(120% 90% at 70% 75%, #3a3a3a 0%, #161616 45%, #070707 100%)';return;}

  const VERT=`
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.,1.);}`;

  /* fbm + domain warping (iq-style): q -> r -> f gives the slow
     "liquify" flow; uSpeed/uAmp mirror the studio settings
     (speed ~15/100, amplitude ~30/100, flow scale ~20). */
  const FRAG=`
precision mediump float;
uniform vec2 uRes;
uniform float uTime;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.,a=.5;
  mat2 rot=mat2(.8,.6,-.6,.8);
  for(int i=0;i<5;i++){v+=a*noise(p);p=rot*p*2.02;a*=.5;}
  return v;
}

void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=uv;p.x*=uRes.x/uRes.y;
  float t=uTime*.045;              /* slow drift */

  /* flow field / liquify: two-level domain warp */
  vec2 q=vec2(fbm(p*1.15+vec2(0.,t*.6)),
              fbm(p*1.15+vec2(5.2,1.3)-t*.4));
  vec2 r=vec2(fbm(p*1.15+1.2*q+vec2(1.7,9.2)+t*.35),
              fbm(p*1.15+1.2*q+vec2(8.3,2.8)-t*.28));
  float f=fbm(p*1.15+1.1*r);

  /* diagonal light mass (bright lower-right ridge like the reference) */
  float diag=dot(uv-vec2(.28,.85),normalize(vec2(.72,-.7)));
  float v=f*.78+diag*.42+.08;
  v=smoothstep(.32,1.05,v);
  v=pow(v,2.35);                   /* deep blacks, silky highlight */

  vec3 col=mix(vec3(.024),vec3(.92,.92,.93),v);
  /* faint cool tint in the mids, like the b&w print */
  col+=vec3(-.004,.0,.012)*v*(1.-v)*2.;

  /* soft vignette */
  col*=1.-.28*length(uv-vec2(.5,.55));

  gl_FragColor=vec4(col,1.);
}`;

  function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
  const prog=gl.createProgram();
  gl.attachShader(prog,sh(gl.VERTEX_SHADER,VERT));
  gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(prog);gl.useProgram(prog);

  const buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(prog,'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

  const uRes=gl.getUniformLocation(prog,'uRes');
  const uTime=gl.getUniformLocation(prog,'uTime');

  /* render at reduced resolution — the image is soft, so this is invisible
     but keeps the shader cheap on large screens */
  const SCALE=.5;
  function resize(){
    const w=Math.max(1,Math.floor(canvas.clientWidth*SCALE));
    const h=Math.max(1,Math.floor(canvas.clientHeight*SCALE));
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w;canvas.height=h;
      gl.viewport(0,0,w,h);gl.uniform2f(uRes,w,h);
    }
  }
  addEventListener('resize',resize);resize();

  let visible=true,raf=0;
  function frame(ms){
    gl.uniform1f(uTime,ms*.001);
    gl.drawArrays(gl.TRIANGLES,0,3);
    if(!reduce&&visible)raf=requestAnimationFrame(frame);
  }

  if('IntersectionObserver'in window){
    new IntersectionObserver(e=>{
      const on=e[0].isIntersecting;
      if(on&&!visible){visible=true;if(!reduce)raf=requestAnimationFrame(frame);}
      else if(!on){visible=false;cancelAnimationFrame(raf);}
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(raf);}
    else if(visible&&!reduce){raf=requestAnimationFrame(frame);}
  });

  raf=requestAnimationFrame(frame); /* reduced motion: single static frame */
})();
