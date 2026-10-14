(() => {
  'use strict';
  const content=document.querySelector('[data-residential]');
  if (!content) return;
  const assets='assets/images/applications/residential/';
  const products={
    switch:{name:'Smart Switch',description:'Explore lighting and scene controls.',image:'switch.webp',href:'smart-switches.html'},
    curtain:{name:'Curtain Motor',description:'Explore motor and shading options.',image:'curtain.webp',href:'curtains.html'},
    thermostat:{name:'Thermostat',description:'Find room temperature controls.',image:'thermostat.webp',href:'thermostats.html'},
    socket:{name:'Smart Socket',description:'Explore power and charging options.',image:'socket.webp',href:'sockets.html'},
    sensor:{name:'Sensor',description:'Explore presence and motion sensing.',image:'sensor.webp',href:'sensors.html'},
    panel:{name:'Control Panel',description:'Explore room control interfaces.',image:'panel.webp',href:'control-panels.html'}
  };
  const rooms={
    living:{
      title:'Living room essentials',label:'Living Room',image:'living-room',alt:'Light-filled living room with oak furniture, soft seating and full-height curtains',products:['switch','curtain','thermostat'],category:'cat-smart-switches',
      intro:'Lighting, privacy and comfort for shared living spaces.',
      plan:'Plan local lighting controls, curtain positions and temperature preferences around how the family uses this room.',
      productDescriptions:{switch:'Plan lighting controls for relaxing and entertaining.',curtain:'Consider daylight and privacy at the windows.',thermostat:'Review temperature preferences for this shared space.'},
      sceneDetails:{welcome:'Plan an arrival setting with suitable light, curtain positions and room temperature.',evening:'Consider softer light and window privacy for relaxing or entertaining.',night:'Review low lighting and curtain privacy before leaving the room.'},
      hotspots:[{x:33,y:20,label:'Explore lighting controls',product:'switch'},{x:20,y:48,label:'Explore curtain options',product:'curtain'}]
    },
    bedroom:{
      title:'Bedroom essentials',label:'Bedroom',image:'bedroom',alt:'Warm residential bedroom with linen bedding, oak furniture and soft daylight',products:['switch','thermostat','curtain'],category:'cat-smart-switches',
      intro:'Bedside operation, window privacy and comfort for rest.',
      plan:'Start with reachable bedside controls, then review room temperature and curtain needs for waking up and winding down.',
      productDescriptions:{switch:'Keep everyday lighting controls within easy reach.',thermostat:'Discuss a comfortable temperature setting for rest.',curtain:'Consider daylight, privacy and the curtain installation.'},
      sceneDetails:{welcome:'Consider accessible bedside light, window privacy and a comfortable room setting.',evening:'Plan softer bedside light and curtain privacy for winding down.',night:'Keep night-time operation within reach; review low-light and temperature preferences.'},
      hotspots:[{x:8,y:42,label:'Explore bedside controls',product:'switch'},{x:85,y:35,label:'Explore curtain options',product:'curtain'}]
    },
    kitchen:{
      title:'Kitchen & dining essentials',label:'Kitchen & Dining',image:'kitchen',alt:'Oak kitchen and dining table in a comfortable sunlit contemporary home',products:['switch','socket','sensor'],category:'cat-smart-switches',
      intro:'Lighting and power for preparation, dining and daily routines.',
      plan:'Review task and dining lighting separately, then consider useful socket locations and any sensing requirements.',
      productDescriptions:{switch:'Plan lighting for preparation and shared meals.',socket:'Review power and charging points where needed.',sensor:'Discuss presence or motion sensing for this space.'},
      sceneDetails:{welcome:'Consider preparation lighting, useful power points and any sensing needs.',evening:'Separate dining light from preparation light; review the controls to include.',night:'Review which kitchen lights should remain on and the controls needed for that plan.'},
      hotspots:[{x:6,y:55,label:'Explore dining lighting controls',product:'switch'}]
    },
    entrance:{
      title:'Entrance essentials',label:'Entrance',image:'entrance',alt:'A calm residential entrance with oak storage, a front door and a wall control',products:['switch','sensor','panel'],category:'cat-control-panels',
      intro:'Clear, accessible controls for arrival and departure.',
      plan:'Choose reachable local controls and review any sensing or room-panel requirements for coming home and leaving.',
      productDescriptions:{switch:'Place entrance lighting controls where they are easy to reach.',sensor:'Review sensing needs around the entry and circulation area.',panel:'Consider an accessible interface for room settings.'},
      sceneDetails:{welcome:'Consider a clear arrival light setting and reachable wall controls.',evening:'Review visibility, local operation and any sensing needs for the entrance.',night:'Discuss useful low-light settings and departure controls for the entrance.'},
      hotspots:[{x:45,y:49,label:'Explore entrance controls',product:'switch'}]
    }
  };
  const scenes={
    welcome:{label:'Welcome Home',description:'A suggested arrival scene: review lighting and curtain settings for your room.'},
    evening:{label:'Evening',description:'A suggested evening scene: softer light and a comfortable room setting.'},
    night:{label:'Good Night',description:'A suggested night scene: low lighting and closed curtains where required.'}
  };
  const projectTypes={
    new:{name:'New Build',title:'Prepare your new-build brief',description:'Plan the room layout and installation context early so the proposed control points can be reviewed.',checklist:['Room list and intended daily routines','Planned control points and wall positions','Product preferences and installation schedule']},
    renovation:{name:'Renovation',title:'Prepare your renovation brief',description:'Review the existing installation with our team before choosing replacement controls.',checklist:['Existing product models and installation photos','Existing wiring and wall-box information for review','Functions to change and preferred replacement finishes']},
    residential:{name:'Residential Project',title:'Prepare your residential project brief',description:'Share the overall scope so room combinations and the delivery stages can be discussed together.',checklist:['Room list and number of spaces in the project','Preferred product categories, finishes and control needs','Project stages, estimated quantities and target schedule']}
  };
  const tabs=[...content.querySelectorAll('[data-res-room]')];
  const image=content.querySelector('[data-res-room-image]');
  const media=content.querySelector('[data-res-room-media]');
  const status=content.querySelector('[data-res-status]');
  let currentRoom='living';
  let currentScene='welcome';
  let currentProject='new';
  function setText(selector,value){
    const node=content.querySelector(selector);
    if(node)node.textContent=value;
  }
  function clearHotspot(){
    const note=content.querySelector('[data-res-hotspot-note]');
    if(note)note.hidden=true;
    setText('[data-res-control-title]','');
    setText('[data-res-control-description]','');
    content.querySelectorAll('[data-res-room-product]').forEach(node=>node.classList.remove('is-active'));
  }
  function setProduct(node,key){
    const product=products[key];
    const link=node.querySelector('a');
    const thumb=node.querySelector('img');
    link.href=product.href;
    thumb.src=assets+product.image;thumb.alt=product.name;
    node.querySelector('strong').textContent=product.name;
    node.dataset.product=key;
    node.querySelector('small').textContent=rooms[currentRoom].productDescriptions[key]||product.description;
  }
  function updateInquiry(){
    const params=new URLSearchParams({application:'residential',room:rooms[currentRoom].label,project:projectTypes[currentProject].name,scene:scenes[currentScene].label});
    content.querySelector('[data-res-inquiry]').href='request-a-quote.html?'+params.toString();
  }
  function selectScene(key,announce=true){
    if(!scenes[key]) return;
    currentScene=key;
    const room=rooms[currentRoom];
    const detail=room.sceneDetails[key];
    media.dataset.scene=key;
    content.querySelectorAll('[data-res-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.resScene===key)));
    content.querySelector('[data-res-scene-caption]').textContent=room.label+' · '+scenes[key].label;
    setText('[data-res-scene-title]',scenes[key].label+' · '+room.label);
    setText('[data-res-scene-detail]',detail);
    updateInquiry();
    if(announce) status.textContent=room.label+' · '+scenes[key].label+'. '+detail;
  }
  function selectRoom(key,announce=true){
    const room=rooms[key];if(!room) return;
    currentRoom=key;
    tabs.forEach(button=>{
      const active=button.dataset.resRoom===key;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
      if(active) content.querySelector('[data-res-room-panel]').setAttribute('aria-labelledby',button.id);
    });
    image.src=assets+room.image+'-1400.webp';
    image.srcset=assets+room.image+'-900.webp 900w, '+assets+room.image+'-1400.webp 1400w';
    image.alt=room.alt;
    content.querySelector('[data-res-room-title]').textContent=room.title;
    setText('[data-res-room-intro]',room.intro);
    content.querySelectorAll('[data-res-room-product]').forEach((node,index)=>setProduct(node,room.products[index]));
    clearHotspot();
    const browse=content.querySelector('[data-res-combination]');
    browse.href='finder.html?category='+room.category;
    browse.setAttribute('aria-label','Explore product options for '+room.label.toLowerCase());
    content.querySelectorAll('[data-res-hotspot]').forEach((button,index)=>{
      const spot=room.hotspots[index];
      button.hidden=!spot;button.setAttribute('aria-pressed','false');if(!spot)return;
      button.style.setProperty('--x',spot.x+'%');button.style.setProperty('--y',spot.y+'%');
      button.dataset.product=spot.product;button.setAttribute('aria-label',spot.label);button.setAttribute('aria-pressed','false');
    });
    content.querySelectorAll('[data-res-map-room]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.resMapRoom===key)));
    setText('[data-res-map-title]',room.label+' control plan');
    setText('[data-res-map-description]',room.plan);
    const mapControls=content.querySelector('[data-res-map-controls]');
    if(mapControls){
      const labels=room.products.map(product=>{
        const label=document.createElement('span');
        label.textContent=products[product].name;
        return label;
      });
      mapControls.replaceChildren(...labels);
    }
    selectScene(currentScene,false);
    if(announce) status.textContent=room.label+': '+room.products.map(product=>products[product].name).join(', ')+'.';
  }
  function selectProject(key,announce=true){
    const project=projectTypes[key];if(!project)return;
    currentProject=key;
    content.querySelectorAll('[data-res-project]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.resProject===key)));
    setText('[data-res-project-title]',project.title);
    content.querySelectorAll('[data-res-project-checklist] li').forEach((item,index)=>{item.textContent=project.checklist[index]||'';});
    setText('[data-res-project-info]',project.description);
    updateInquiry();
    if(announce)status.textContent=project.name+'. '+project.description;
  }
  tabs.forEach((button,index)=>{
    button.addEventListener('click',()=>selectRoom(button.dataset.resRoom));
    button.addEventListener('keydown',event=>{
      let target;
      if(event.key==='ArrowRight')target=(index+1)%tabs.length;
      if(event.key==='ArrowLeft')target=(index-1+tabs.length)%tabs.length;
      if(event.key==='Home')target=0;
      if(event.key==='End')target=tabs.length-1;
      if(target===undefined)return;
      event.preventDefault();selectRoom(tabs[target].dataset.resRoom);tabs[target].focus();
    });
  });
  content.querySelectorAll('[data-res-scene]').forEach(button=>button.addEventListener('click',()=>selectScene(button.dataset.resScene)));
  content.querySelectorAll('[data-res-hotspot]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.product;
    const product=products[key];if(!product)return;
    const description=rooms[currentRoom].productDescriptions[key]||product.description;
    content.querySelectorAll('[data-res-hotspot]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
    content.querySelectorAll('[data-res-room-product]').forEach(node=>node.classList.toggle('is-active',node.dataset.product===key));
    setText('[data-res-control-title]',product.name+' · '+rooms[currentRoom].label);
    setText('[data-res-control-description]',description+' Final configuration depends on the selected model.');
    const note=content.querySelector('[data-res-hotspot-note]');
    if(note)note.hidden=false;
    button.focus({preventScroll:true});
    status.textContent=product.name+'. '+description;
  }));
  content.querySelectorAll('[data-res-map-room]').forEach(button=>button.addEventListener('click',()=>{
    selectRoom(button.dataset.resMapRoom);
  }));
  content.querySelectorAll('[data-res-project]').forEach(button=>button.addEventListener('click',()=>selectProject(button.dataset.resProject)));
  selectRoom('living',false);selectProject('new',false);
  content.classList.add('res-ready');
  const applicationMenu=document.querySelector('[data-menu="applications"]');
  if(applicationMenu){applicationMenu.classList.add('is-current');applicationMenu.querySelector('summary')?.setAttribute('aria-current','page');}
})();

