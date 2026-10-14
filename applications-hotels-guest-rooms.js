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
})({"slug":"hotels-guest-rooms","directory":"04-酒店与客房","label":"Hotels & Guest Rooms","title":"Hotel & Guestroom Control Planning — Hauslysmart","hero":"Thoughtful controls for the guest room.","lead":"Plan bedside operation, comfort settings and clear service requests.","description":"Explore hotel guestroom control planning for bedside operation, curtains, temperature and DND or MUR indication requirements. Prepare a clear room specification.","mainTitle":"Plan the guestroom touchpoints.","mainIntro":"Choose a suggested guest scene, then select a touchpoint to review its products and specification needs.","mainKicker":"GUESTROOM PLANNING","mainOutput":"room","mainAlt":"Illustrative hotel guestroom with bedside controls, full-height curtains and an entrance","modes":{"arrival":{"label":"Arrival","zones":[{"key":"bedside","label":"Bedside","x":48,"y":44,"summary":"Consider an accessible set of guest controls for lighting and room preferences after arrival.","products":["hotel","thermostat","curtain"],"check":["Agree the button functions and clear guest-facing wording.","Confirm each proposed function against the selected products."]},{"key":"window","label":"Window","x":24,"y":35,"summary":"Review how curtain operation and local lighting can support daylight and privacy.","products":["curtain","hotel","thermostat"],"check":["Share the curtain type, track and intended operation.","Confirm installation requirements and suitable models."]},{"key":"entrance","label":"Entrance","x":89,"y":39,"summary":"Plan clearly identified entrance controls and any door-indication requirements.","products":["hotel","switch","module"],"check":["Define control locations and indication wording.","Review wiring and the selected product configuration."]}]},"reading":{"label":"Reading","zones":[{"key":"bedside","label":"Bedside","x":48,"y":44,"summary":"Consider easy-to-reach local operation for the reading lights used by each guest.","products":["hotel","switch","thermostat"],"check":["Review reading-light circuits and guest control positions.","Confirm available functions rather than assuming a preset scene."]},{"key":"window","label":"Window","x":24,"y":35,"summary":"Discuss daylight and curtain positions that suit reading and privacy preferences.","products":["curtain","hotel","thermostat"],"check":["Review glazing, curtain operation and local lighting needs.","Confirm the product and installation scope."]},{"key":"entrance","label":"Entrance","x":89,"y":39,"summary":"Consider how entrance lighting and service indication should remain clear while the room is in use.","products":["hotel","switch","module"],"check":["Define the intended local controls and indications.","Confirm final wiring and product functions with the project team."]}]},"resting":{"label":"Resting","zones":[{"key":"bedside","label":"Bedside","x":48,"y":44,"summary":"Consider a simple low-light preference and accessible bedside operation for rest.","products":["hotel","thermostat","curtain"],"check":["Review guest-facing button wording and local controls.","Confirm the chosen products support the requested configuration."]},{"key":"window","label":"Window","x":24,"y":35,"summary":"Review curtain closure, privacy and the proposed temperature-control arrangement.","products":["curtain","thermostat","hotel"],"check":["Confirm curtain travel and installation details.","Review temperature-control requirements for the room."]},{"key":"entrance","label":"Entrance","x":89,"y":39,"summary":"Specify any Do Not Disturb indication and how the guest request should be shown at the door.","products":["hotel","module","switch"],"check":["Agree DND and MUR wording and the intended indication.","Confirm product functions, wiring and any external integration separately."]}]}},"products":["hotel","thermostat","curtain","module"],"second":{"kind":"service","title":"Clear service requests at the door.","intro":"Review Do Not Disturb and Make Up Room as part of the guestroom indication brief."},"serviceStates":{"clear":{"label":"No Request","title":"No service request selected","description":"Discuss the normal indication and the location of the guest controls."},"dnd":{"label":"Do Not Disturb","title":"DND indication to review","description":"Define the guest request, door-side indication, wording and reset requirements for product review."},"mur":{"label":"Make Up Room","title":"MUR indication to review","description":"Define the service request and how it should be indicated. Confirm the selected product functions and wiring."}},"productTitle":"Products for the room specification.","projects":{"new":{"label":"New Hotel","title":"Prepare a repeatable room specification","description":"Define the room types and the control requirements before product selection.","items":["Room types, quantities and typical layouts","Bedside and entrance controls, indication wording and finishes","Installation context and the project schedule"]},"refurbishment":{"label":"Room Refurbishment","title":"Review the current guestroom controls","description":"Document the existing controls and the changes you want to make.","items":["Existing room-control models and installation photographs","Wiring and wall-box information, guest-facing functions to change","Rooms to update, finish preferences and target dates"]},"phased":{"label":"Phased Rollout","title":"Prepare the room-by-room rollout brief","description":"Keep the product and finish requirements clear across delivery stages.","items":["Room groups and quantities in each stage","Reference product configuration and indication wording","Installation access, delivery stages and target schedule"]}},"projectTitle":"Prepare a repeatable room brief.","cta":"Plan your guestroom configuration.","ctaCopy":"Share the room requirements, indication needs and project schedule.","assets":"assets/images/applications/hotels-guest-rooms/","productData":{"switch":{"name":"Smart Switches","role":"LIGHTING","description":"Explore local lighting and scene controls.","href":"smart-switches.html"},"panel":{"name":"Control Panels","role":"INTERFACE","description":"Discuss a suitable room control interface.","href":"control-panels.html"},"thermostat":{"name":"Thermostats","role":"CLIMATE","description":"Review room temperature control requirements.","href":"thermostats.html"},"curtain":{"name":"Curtain Motors","role":"SHADING","description":"Review curtain type, travel and installation.","href":"curtains.html"},"sensor":{"name":"Presence Sensors","role":"SENSING","description":"Discuss sensing needs and suitable placement.","href":"sensors.html"},"socket":{"name":"Sockets","role":"POWER","description":"Plan the power and charging points needed.","href":"sockets.html"},"hotel":{"name":"Hotel Room Panels","role":"GUEST OPERATION","description":"Review guestroom buttons and control wording.","href":"hotel-switches.html"},"module":{"name":"Control Modules","role":"CONFIGURATION","description":"Confirm functions and installation per model.","href":"controllers.html"}}});
