/* Slowly drifting, diffuse daylight. CSS supplies a static fallback. */
(function(){
  const canvas=document.getElementById('heroBg');
  if(!canvas)return;
  const renderer=document.createElement('canvas');
  const gl=renderer.getContext('webgl',{antialias:false,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)return;
  const bitmap=canvas.getContext('2d');
  if(!bitmap)return;

  const vertex=`
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.,1.);}`;
  const fragment=`
precision mediump float;
uniform vec2 uRes;
uniform vec3 uSurface;
uniform float uTime;

float ray(vec2 point,vec2 source,vec2 target,float spread){
  vec2 direction=normalize(target-source);
  vec2 offset=point-source;
  float along=dot(offset,direction);
  float across=abs(offset.x*direction.y-offset.y*direction.x);
  float width=.035+max(along,0.)*spread;
  float d=across/width;
  return exp(-d*d)*smoothstep(0.,.15,along)/(1.+max(along,0.)*.15);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  uv.y=1.-uv.y;
  float aspect=uRes.x/uRes.y;
  vec2 point=vec2(uv.x*aspect,uv.y);
  float drift=sin(uTime*.13)*.045;
  // Separate sources, unequal widths and overlapping halos produce scattered
  // daylight instead of identical cones radiating from one corner.
  vec2 a=vec2((.93+drift)*aspect,-.24);
  vec2 b=vec2((.38-drift*.5)*aspect,-.42);
  vec2 c=vec2(1.24*aspect,.02+drift);
  float light=ray(point,a,vec2(.06*aspect,1.2),.095)*.085;
  light+=ray(point,a,vec2((.52+drift)*aspect,1.2),.045)*.1;
  light+=ray(point,b,vec2(-.48*aspect,1.2),.12)*.055;
  light+=ray(point,c,vec2(.68*aspect,1.2),.075)*.065;
  light+=ray(point,a,vec2(.2*aspect,1.2),.3)*.04;
  float shade=ray(point,a,vec2((.33-drift)*aspect,1.2),.12)*.035;
  float glow=exp(-length(point-a)*1.4)*.025;
  vec3 colour=uSurface+vec3(1.,.94,.8)*(light+glow)-vec3(shade);
  gl_FragColor=vec4(clamp(colour,0.,1.),1.);
}`;

  function compile(type,source){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}
    return shader;
  }
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  if(!vs||!fs)return;
  const program=gl.createProgram();
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'aPos');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const resolution=gl.getUniformLocation(program,'uRes');
  const surface=gl.getUniformLocation(program,'uSurface');
  const time=gl.getUniformLocation(program,'uTime');
  const rgb=getComputedStyle(canvas.parentElement).backgroundColor.match(/[\d.]+/g);
  gl.uniform3f(surface,+rgb[0]/255,+rgb[1]/255,+rgb[2]/255);

  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,frame=0,last=0,elapsed=0,lost=false;
  function draw(){
    gl.uniform1f(time,motion.matches?8:elapsed);
    gl.drawArrays(gl.TRIANGLES,0,3);
    bitmap.drawImage(renderer,0,0);
    canvas.classList.add('is-ready');
  }
  function tick(now){
    frame=0;
    if(last&&now-last>=1000/30){
      elapsed+=Math.min((now-last)/1000,.1);last=now;draw();
    }else if(!last){last=now;draw();}
    if(visible&&!document.hidden&&!motion.matches&&!lost)frame=requestAnimationFrame(tick);
  }
  function updatePlayback(){
    cancelAnimationFrame(frame);frame=0;last=0;
    if(!lost&&visible&&!document.hidden){
      if(motion.matches)draw();else frame=requestAnimationFrame(tick);
    }
  }
  function resize(){
    const scale=Math.min(.6,1200/canvas.clientWidth,800/canvas.clientHeight);
    canvas.width=Math.max(1,Math.round(canvas.clientWidth*scale));
    canvas.height=Math.max(1,Math.round(canvas.clientHeight*scale));
    renderer.width=canvas.width;renderer.height=canvas.height;
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(resolution,canvas.width,canvas.height);
    if(!lost)draw();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updatePlayback();}).observe(canvas);
  document.addEventListener('visibilitychange',updatePlayback);
  motion.addEventListener('change',updatePlayback);
  renderer.addEventListener('webglcontextlost',e=>{
    e.preventDefault();lost=true;updatePlayback();canvas.classList.remove('is-ready');
  });
  resize();
})();
