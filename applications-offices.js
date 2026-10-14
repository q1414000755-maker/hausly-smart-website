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
})({"slug":"offices","directory":"05-智慧办公室","label":"Offices","title":"Office & Meeting Room Control Planning — Hauslysmart","hero":"Controls planned around the way you work.","lead":"Explore product configurations for workstations, meetings and shared office areas.","description":"Plan office control products by workspace. Explore workstation, meeting room, private office and shared-area configurations and prepare a fit-out brief.","mainTitle":"Start with the workspace.","mainIntro":"Select a space and a zone to explore local controls, sensing requirements and room interfaces.","mainKicker":"WORKSPACE PLANNING","mainOutput":"workspace","mainAlt":"Illustrative office layout with workstations, a glass meeting room, a private office and shared entrance","modes":{"open":{"label":"Open Office","zones":[{"key":"desks","label":"Workstations","x":31,"y":46,"summary":"Plan local lighting and control positions around desk groups and everyday movement.","products":["switch","sensor","panel"],"check":["Share the lighting zones and intended control points.","Confirm sensing functions and placement for the selected model."]},{"key":"daylight","label":"Window Side","x":18,"y":39,"summary":"Review the lighting and shading requirements around the daylight-facing workstations.","products":["switch","curtain","thermostat"],"check":["Discuss glare, daylight and local-operation needs.","Confirm curtain and temperature-control installation requirements."]},{"key":"route","label":"Circulation","x":54,"y":60,"summary":"Keep shared controls clear and reachable along the main office route.","products":["switch","sensor","panel"],"check":["Identify control positions and circulation lighting.","Review sensing and interface requirements separately."]}]},"meeting":{"label":"Meeting Room","zones":[{"key":"table","label":"Meeting Table","x":68,"y":23,"summary":"Define the lighting and room-operation needs of the meeting space.","products":["panel","switch","thermostat"],"check":["Review meeting activities and local control points.","Confirm the functions of the proposed interface."]},{"key":"meeting-window","label":"Glazing & Shading","x":81,"y":27,"summary":"Consider daylight and privacy needs before selecting shading products.","products":["curtain","switch","panel"],"check":["Share the glazing, curtain or blind details.","Confirm suitable products and installation conditions."]},{"key":"meeting-entry","label":"Room Entrance","x":56,"y":37,"summary":"Place a clear room interface where users can find it on arrival.","products":["panel","switch","sensor"],"check":["Review the control location and proposed wording.","Confirm any sensing requirements per model."]}]},"private":{"label":"Private Office","zones":[{"key":"desk","label":"Desk Area","x":73,"y":55,"summary":"Discuss a practical lighting and control arrangement for individual work.","products":["switch","thermostat","panel"],"check":["Review desk position and task-lighting needs.","Choose product interfaces and finishes for the room."]},{"key":"private-window","label":"Window","x":84,"y":51,"summary":"Review window privacy, daylight and room temperature preferences.","products":["curtain","thermostat","switch"],"check":["Share window and curtain installation details.","Confirm the intended room-control functions."]},{"key":"private-entry","label":"Office Entrance","x":64,"y":59,"summary":"Keep lighting and room controls easy to locate when entering the office.","products":["switch","panel","sensor"],"check":["Identify wall-control positions and installation context.","Confirm any sensing functions and suitable placement."]}]},"shared":{"label":"Shared Areas","zones":[{"key":"reception","label":"Reception","x":74,"y":75,"summary":"Plan a clear local-control specification for the reception and waiting area.","products":["switch","panel","thermostat"],"check":["Review lighting, operating points and comfort requirements.","Confirm the final product configuration."]},{"key":"corridor","label":"Shared Route","x":57,"y":66,"summary":"Define circulation lighting and review any sensing requirements.","products":["switch","sensor","panel"],"check":["Share the layout and intended control zones.","Confirm sensing functions and installation conditions."]},{"key":"office-entrance","label":"Office Entrance","x":65,"y":84,"summary":"Provide clearly identified local controls near the main entrance.","products":["switch","sensor","panel"],"check":["Review entrance control points and user needs.","Confirm the selected products and their placement."]}]}},"products":["switch","panel","sensor","thermostat"],"second":{"kind":"meeting","title":"A meeting room, clearly specified.","intro":"Use the discussion points below to define the room requirements before choosing products."},"scenes":{"discussion":{"label":"Discussion","title":"Discussion setup to review","description":"Consider clear lighting for conversation and note-taking, with an accessible room interface.","items":["Lighting needs around the table","Daylight and privacy preferences","Local interface and button wording"]},"presentation":{"label":"Presentation","title":"Presentation setup to review","description":"Review screen visibility, daylight glare and the room lighting needed during presentations.","items":["Lighting around the screen and audience","Curtain or shading installation requirements","Room-interface functions to confirm"]},"after":{"label":"After Use","title":"After-use setup to review","description":"Define how occupants should leave the room and which local controls or sensing functions are required.","items":["Lighting and room-control preferences after use","Any sensing functions requiring model review","Operating instructions and control positions"]}},"productTitle":"Products for your office specification.","projects":{"new":{"label":"New Office","title":"Define the workspace specification","description":"Map the spaces, control needs and installation context before selecting products.","items":["Workstation, meeting and shared-area layouts","Product categories, control locations and sensing needs","Preferred finishes, installation context and schedule"]},"fitout":{"label":"Fit-out","title":"Prepare the fit-out control brief","description":"Review the workspace layout and existing installation before confirming the product set.","items":["Layout, existing installation photos and product models","Changes to lighting, interfaces or room-control requirements","Finish preferences and target fit-out dates"]},"phased":{"label":"Phased Update","title":"Plan the update by workspace","description":"Define the spaces to update and retain a clear product specification across stages.","items":["Areas and product needs in each stage","Product series and finishes to retain or change","Installation access, estimated quantities and target schedule"]}},"projectTitle":"Prepare the workspace brief.","cta":"Plan your workplace controls.","ctaCopy":"Share the workspaces, control requirements and fit-out context.","assets":"assets/images/applications/offices/","productData":{"switch":{"name":"Smart Switches","role":"LIGHTING","description":"Explore local lighting and scene controls.","href":"smart-switches.html"},"panel":{"name":"Control Panels","role":"INTERFACE","description":"Discuss a suitable room control interface.","href":"control-panels.html"},"thermostat":{"name":"Thermostats","role":"CLIMATE","description":"Review room temperature control requirements.","href":"thermostats.html"},"curtain":{"name":"Curtain Motors","role":"SHADING","description":"Review curtain type, travel and installation.","href":"curtains.html"},"sensor":{"name":"Presence Sensors","role":"SENSING","description":"Discuss sensing needs and suitable placement.","href":"sensors.html"},"socket":{"name":"Sockets","role":"POWER","description":"Plan the power and charging points needed.","href":"sockets.html"},"hotel":{"name":"Hotel Room Panels","role":"GUEST OPERATION","description":"Review guestroom buttons and control wording.","href":"hotel-switches.html"},"module":{"name":"Control Modules","role":"CONFIGURATION","description":"Confirm functions and installation per model.","href":"controllers.html"}}});
