(function(){
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  ready(function(){
    document.querySelectorAll('[data-carousel]').forEach(function(carousel){
      var track=carousel.querySelector('[data-carousel-track]');
      var prev=carousel.querySelector('[data-carousel-prev]');
      var next=carousel.querySelector('[data-carousel-next]');
      if(!track)return;
      var step=function(){return Math.max(track.clientWidth*.72,240);};
      function update(){
        var max=Math.max(0,track.scrollWidth-track.clientWidth-2);
        if(prev)prev.disabled=track.scrollLeft<=2;
        if(next)next.disabled=track.scrollLeft>=max;
      }
      if(prev)prev.addEventListener('click',function(){track.scrollBy({left:-step(),behavior:'smooth'});});
      if(next)next.addEventListener('click',function(){track.scrollBy({left:step(),behavior:'smooth'});});
      track.addEventListener('scroll',update,{passive:true});
      window.addEventListener('resize',update,{passive:true});
      update();
    });

    var progress=document.querySelector('[data-scroll-progress]');
    function progressUpdate(){
      if(!progress)return;
      var max=document.documentElement.scrollHeight-window.innerHeight;
      progress.style.transform='scaleX('+(max>0?Math.min(1,Math.max(0,window.scrollY/max)):0)+')';
    }
    if(progress){window.addEventListener('scroll',progressUpdate,{passive:true});window.addEventListener('resize',progressUpdate,{passive:true});progressUpdate();}

    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
      var targets=document.querySelectorAll('.section,.floating-card,.shop-the-look,[data-reveal]');
      targets.forEach(function(el){el.classList.add('edenrose-reveal');});
      var observer=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
        });
      },{rootMargin:'0px 0px -8% 0px',threshold:.05});
      targets.forEach(function(el){observer.observe(el);});
    }
  });
})();