/* Straight sunlight cones share a source above the upper-right corner.
   CSS supplies static rays if WebGL is unavailable. */
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

float ray(vec2 offset,vec2 direction,float spread){
  float along=dot(offset,direction);
  float across=abs(offset.x*direction.y-offset.y*direction.x);
  // Preserve the width at the upper edge, then widen linearly to twice
  // the previous width at the bottom. Linear edges keep the rays straight.
  float topDistance=.14/direction.y;
  float bottomDistance=1.14/direction.y;
  float expansion=max(along-topDistance,0.)/(bottomDistance-topDistance);
  float width=.004+max(along,0.)*spread
             +expansion*(.004+bottomDistance*spread);
  float d=across/width;
  return exp(-d*d)*smoothstep(0.,.04,along)/(1.+max(along,0.)*.24);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  uv.y=1.-uv.y;
  float aspect=uRes.x/uRes.y;
  vec2 source=vec2(1.04*aspect,-.14);
  vec2 offset=vec2(uv.x*aspect,uv.y)-source;
  vec2 first=normalize(vec2(.16*aspect,1.)-source);
  vec2 second=normalize(vec2(.57*aspect,1.)-source);
  vec2 third=normalize(vec2(.94*aspect,1.)-source);
  float light=ray(offset,first,.025)*.17
             +ray(offset,second,.032)*.22
             +ray(offset,third,.04)*.16;
  // Broader, faint scattering surrounds the straight cores.
  light+=ray(offset,first,.07)*.025
        +ray(offset,second,.085)*.03
        +ray(offset,third,.095)*.025;
  light+=.065*exp(-length(offset)*3.);
  vec3 colour=uSurface+vec3(1.,.98,.94)*light;
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
  const rgb=getComputedStyle(canvas.parentElement).backgroundColor.match(/[\d.]+/g);
  gl.uniform3f(surface,+rgb[0]/255,+rgb[1]/255,+rgb[2]/255);

  function draw(){
    gl.drawArrays(gl.TRIANGLES,0,3);
    // Cache the static shader in a 2D surface so scrolling cannot discard it.
    bitmap.drawImage(renderer,0,0);
    canvas.classList.add('is-ready');
  }
  function resize(){
    // Soft rays need no full-resolution buffer; cap the GPU workload on wide screens.
    const scale=Math.min(.6,1200/canvas.clientWidth,800/canvas.clientHeight);
    canvas.width=Math.max(1,Math.round(canvas.clientWidth*scale));
    canvas.height=Math.max(1,Math.round(canvas.clientHeight*scale));
    renderer.width=canvas.width;renderer.height=canvas.height;
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(resolution,canvas.width,canvas.height);draw();
  }
  new ResizeObserver(resize).observe(canvas);
  renderer.addEventListener('webglcontextlost',e=>{
    e.preventDefault();canvas.classList.remove('is-ready');
  });
  resize();
})();
