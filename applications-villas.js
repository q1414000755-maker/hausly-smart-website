(function runtime(DATA){
  'use strict';
  const content=document.querySelector('[data-application-content]');
  if(!content)return;
  const modes=DATA.modes,projects=DATA.projects,products=DATA.productData;
  const modeKeys=Object.keys(modes),projectKeys=Object.keys(projects);
  let currentMode=modeKeys[0],currentFocus=modes[currentMode].zones[0].key,currentProject=projectKeys[0];
  let currentScene=DATA.scenes?Object.keys(DATA.scenes)[0]:null,currentService='clear';
  const find=selector=>content.querySelector(selector);
  const all=selector=>[...content.querySelectorAll(selector)];
  const text=(selector,value)=>{const node=find(selector);if(node)node.textContent=value;};
  const selectedZone=()=>modes[currentMode].zones.find(zone=>zone.key===currentFocus);
  function announce(value){text('[data-live]',value);}
  function setList(selector,values){const list=find(selector);if(!list)return;list.replaceChildren(...values.map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));}
  function summary(){
    const zone=selectedZone();
    text('[data-summary-mode]',modes[currentMode].label);
    text('[data-summary-focus]',zone.label);
    text('[data-summary-project]',projects[currentProject].label);
    const group=find('[data-summary-products]');
    group.replaceChildren(...zone.products.map(key=>{const node=document.createElement('span');node.textContent=products[key].name;return node;}));
    let focus=modes[currentMode].label+' / '+zone.label;
    if(DATA.slug==='hotels-guest-rooms'){
      focus='Guest Room / '+zone.label+' / '+modes[currentMode].label;
      if(currentService!=='clear')focus+=' / '+DATA.serviceStates[currentService].label;
    }
    if(DATA.slug==='offices'&&currentMode==='meeting'&&currentScene)focus+=' / '+DATA.scenes[currentScene].label;
    const params=new URLSearchParams({application:DATA.slug,focus,project:projects[currentProject].label});
    all('[data-application-enquiry]').forEach(link=>{link.href='request-a-quote.html?'+params.toString();});
  }
  function renderFocus(key,notify=true){
    const zone=modes[currentMode].zones.find(item=>item.key===key);if(!zone)return;
    currentFocus=key;
    text('[data-selected-mode]',modes[currentMode].label);
    text('[data-focus-title]',zone.label);
    text('[data-focus-description]',zone.summary);
    all('[data-focus-key]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.focusKey===key)));
    all('[data-mini-product]').forEach((item,index)=>{
      const product=products[zone.products[index]],link=item.querySelector('a'),image=item.querySelector('img');
      item.dataset.product=zone.products[index];
      link.href=product.href;image.src=DATA.assets+zone.products[index]+'.webp';image.alt=product.name;
      item.querySelector('strong').textContent=product.name;item.querySelector('small').textContent=product.description;
    });
    setList('[data-focus-checklist]',zone.check);summary();
    if(notify)announce(zone.label+'. '+zone.summary);
  }
  function renderMode(key,notify=true){
    if(!modes[key])return;currentMode=key;
    const tabs=all('[data-mode-key]');
    tabs.forEach(button=>{const active=button.dataset.modeKey===key;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active)find('[data-explorer-panel]').setAttribute('aria-labelledby',button.id);});
    find('[data-map]').dataset.mode=key;
    const controls=find('[data-zone-controls]'),hotspots=find('[data-hotspots]');
    controls.replaceChildren();hotspots.replaceChildren();
    modes[key].zones.forEach((zone,index)=>{
      const button=document.createElement('button');button.type='button';button.className='ax-choice';button.dataset.focusKey=zone.key;button.textContent=zone.label;button.setAttribute('aria-pressed','false');controls.append(button);
      const hotspot=document.createElement('button');hotspot.type='button';hotspot.className='ax-hotspot';hotspot.dataset.focusKey=zone.key;hotspot.textContent=String(index+1);hotspot.setAttribute('aria-label','Review '+zone.label);hotspot.setAttribute('aria-pressed','false');hotspot.style.setProperty('--x',zone.x+'%');hotspot.style.setProperty('--y',zone.y+'%');hotspots.append(hotspot);
    });
    renderFocus(modes[key].zones[0].key,false);
    if(notify)announce(modes[key].label+'. '+selectedZone().summary);
  }
  function renderProject(key,notify=true){
    if(!projects[key])return;currentProject=key;
    all('[data-project-key]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.projectKey===key)));
    text('[data-project-title]',projects[key].title);text('[data-project-description]',projects[key].description);setList('[data-project-checklist]',projects[key].items);summary();
    if(notify)announce(projects[key].label+'. '+projects[key].description);
  }
  function renderScene(key,notify=true){
    if(!DATA.scenes||!DATA.scenes[key])return;currentScene=key;const scene=DATA.scenes[key];
    all('[data-scene-key]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sceneKey===key)));
    text('[data-scene-title]',scene.title);text('[data-scene-description]',scene.description);setList('[data-scene-checklist]',scene.items);
    summary();
    if(notify)announce(scene.label+'. '+scene.description);
  }
  function renderService(key,notify=true){
    if(!DATA.serviceStates||!DATA.serviceStates[key])return;currentService=key;const state=DATA.serviceStates[key];
    all('[data-service-key]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.serviceKey===key)));
    all('[data-service-light]').forEach(node=>{node.dataset.lit=String(node.dataset.serviceLight===key);});
    text('[data-service-title]',state.title);text('[data-service-description]',state.description);
    summary();
    if(notify)announce(state.label+'. '+state.description);
  }
  content.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||!content.contains(button))return;
    if(button.dataset.modeKey)renderMode(button.dataset.modeKey);
    if(button.dataset.focusKey)renderFocus(button.dataset.focusKey);
    if(button.dataset.projectKey)renderProject(button.dataset.projectKey);
    if(button.dataset.sceneKey)renderScene(button.dataset.sceneKey);
    if(button.dataset.serviceKey)renderService(button.dataset.serviceKey);
  });
  const tabs=all('[data-mode-key]');
  tabs.forEach((button,index)=>button.addEventListener('keydown',event=>{
    let target;if(event.key==='ArrowRight')target=(index+1)%tabs.length;if(event.key==='ArrowLeft')target=(index-1+tabs.length)%tabs.length;if(event.key==='Home')target=0;if(event.key==='End')target=tabs.length-1;if(target===undefined)return;event.preventDefault();renderMode(tabs[target].dataset.modeKey);tabs[target].focus();
  }));
  renderMode(currentMode,false);renderProject(currentProject,false);
  if(currentScene)renderScene(currentScene,false);
  if(DATA.serviceStates)renderService(currentService,false);
  content.classList.add('ax-ready');
  const menu=document.querySelector('[data-menu="applications"]');if(menu){menu.classList.add('is-current');menu.querySelector('summary')?.setAttribute('aria-current','page');}
})({"slug":"villas","directory":"03-智慧别墅","label":"Villas","title":"Villa Controls by Floor & Zone — Hauslysmart","hero":"Control planning for every level.","lead":"Explore lighting, climate and shading products across floors and zones.","description":"Plan villa control products by floor and zone. Explore lighting, climate and curtain options, product categories and a clear project brief.","mainTitle":"Start with the floor, then the zone.","mainIntro":"Select a level to explore suggested product combinations and the information needed to confirm them.","mainKicker":"FLOOR & ZONE PLANNING","mainOutput":"floor-plan","mainAlt":"Illustrative two-storey villa cutaway with bedrooms, living area, kitchen and terrace","modes":{"ground":{"label":"Ground Floor","zones":[{"key":"living","label":"Living & Dining","x":35,"y":57,"summary":"Plan the everyday lighting, window privacy and comfort needs of the shared living space.","products":["switch","curtain","thermostat"],"check":["Separate lighting requirements by use.","Confirm curtain installation and temperature control per model."]},{"key":"kitchen","label":"Kitchen","x":75,"y":57,"summary":"Review worktop lighting, local operation and convenient power points before choosing products.","products":["switch","socket","panel"],"check":["Share intended lighting circuits and power locations.","Review the wall-box and interface requirements."]},{"key":"entry","label":"Entrance","x":63,"y":57,"summary":"Keep entry controls accessible and clearly identified for residents and visitors.","products":["switch","sensor","panel"],"check":["Review switch and panel positions at the entrance.","Confirm any sensing function and placement per selected model."]}]},"upper":{"label":"Upper Floor","zones":[{"key":"bedroom","label":"Main Bedroom","x":35,"y":31,"summary":"Plan comfortable bedside operation, window privacy and temperature preferences.","products":["switch","curtain","thermostat"],"check":["Identify bedside and entrance control points.","Confirm curtain and temperature-control requirements."]},{"key":"study","label":"Study","x":53,"y":31,"summary":"Discuss lighting and room operation suited to focused work and reading.","products":["switch","panel","thermostat"],"check":["Separate task lighting from general lighting needs.","Choose an interface and finish that suits the room."]},{"key":"guest-bedroom","label":"Guest Bedroom","x":72,"y":32,"summary":"Keep the room controls simple and easy to understand for occasional guests.","products":["switch","curtain","thermostat"],"check":["Plan clearly labelled local controls.","Review daylight, privacy and temperature needs."]}]},"outdoor":{"label":"Outdoor","zones":[{"key":"terrace","label":"Terrace","x":15,"y":62,"summary":"Review terrace lighting and where indoor-accessible controls should be placed.","products":["switch","panel","sensor"],"check":["Confirm exposure and enclosure requirements before selection.","Check the suitability of every product for its installation location."]},{"key":"garden","label":"Garden Approach","x":16,"y":73,"summary":"Define the approach lighting and any sensing requirements as a separate installation scope.","products":["sensor","switch","panel"],"check":["Share the intended locations and environmental conditions.","Confirm model suitability and installation with the project team."]},{"key":"access","label":"Entry Approach","x":64,"y":74,"summary":"Plan a clear route to the entrance with accessible control points.","products":["switch","sensor","panel"],"check":["Review lighting and local-operation requirements.","Outdoor placement needs a specific environmental review."]}]}},"products":["switch","panel","thermostat","curtain"],"second":{"kind":"planning","title":"A clear specification across floors.","intro":"Record the control needs of each level before choosing a consistent product set.","cards":[["Local operation","Map switches and panels to rooms, routes and convenient operating positions."],["Comfort options","Review curtain and temperature requirements separately for each room."],["Product finishes","Discuss product series and finishes for a coherent appearance across floors."]]},"productTitle":"Products for your villa configuration.","projects":{"new":{"label":"New Build","title":"Prepare the floor-by-floor brief","description":"Plan the control points before installation details are fixed.","items":["Floor drawings and the rooms on each level","Planned control points and installation locations","Preferred product categories, finishes and schedule"]},"renovation":{"label":"Renovation","title":"Review the existing installation","description":"Share the current installation so proposed replacements can be reviewed.","items":["Existing models and clear installation photographs","Available wiring and wall-box information for review","Functions to change and preferred replacement finishes"]},"phased":{"label":"Phased Project","title":"Plan the work in practical stages","description":"Define the floors and rooms to be completed in each stage.","items":["Areas and control needs for each project stage","Product and finish preferences to retain throughout","Target stages, estimated quantities and installation context"]}},"projectTitle":"Prepare the project, level by level.","cta":"Plan your villa controls with us.","ctaCopy":"Share your floors, control requirements and preferred finishes.","assets":"assets/images/applications/villas/","productData":{"switch":{"name":"Smart Switches","role":"LIGHTING","description":"Explore local lighting and scene controls.","href":"smart-switches.html"},"panel":{"name":"Control Panels","role":"INTERFACE","description":"Discuss a suitable room control interface.","href":"control-panels.html"},"thermostat":{"name":"Thermostats","role":"CLIMATE","description":"Review room temperature control requirements.","href":"thermostats.html"},"curtain":{"name":"Curtain Motors","role":"SHADING","description":"Review curtain type, travel and installation.","href":"curtains.html"},"sensor":{"name":"Presence Sensors","role":"SENSING","description":"Discuss sensing needs and suitable placement.","href":"sensors.html"},"socket":{"name":"Sockets","role":"POWER","description":"Plan the power and charging points needed.","href":"sockets.html"},"hotel":{"name":"Hotel Room Panels","role":"GUEST OPERATION","description":"Review guestroom buttons and control wording.","href":"hotel-switches.html"},"module":{"name":"Control Modules","role":"CONFIGURATION","description":"Confirm functions and installation per model.","href":"controllers.html"}}});
