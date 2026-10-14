(() => {
 'use strict';
 const root=document.querySelector('[data-application="hvac-climate-control"]');
 if(!root)return;
 const query=selector=>root.querySelector(selector);
 const all=selector=>[...root.querySelectorAll(selector)];
 const text=(selector,value)=>{const el=query(selector);if(el)el.textContent=value;};
 const rooms={
  living:{name:'Living Room',photo:'living-room',alt:'Daylit residential living room with comfortable seating',description:'Shared comfort for relaxing, family time and entertaining.',temperature:23,mode:'cooling'},
  bedroom:{name:'Bedroom',photo:'bedroom',alt:'Warm bedroom with linen bedding and soft natural light',description:'Room settings for winding down, sleeping and waking up.',temperature:22,mode:'heating'},
  study:{name:'Home Office',photo:'home-office',base:'hvac-climate-control',alt:'Residential home office with an oak desk, daylight and a wall thermostat',description:'A setting for a home work area and focused daily routines.',temperature:24,mode:'cooling'}
 };
 const modes={cooling:{name:'Cooling',copy:'Preview a cooling preference. Supported modes depend on the thermostat and connected equipment.'},heating:{name:'Heating',copy:'Preview a heating preference. Heating control and sensing requirements depend on the selected installation.'},fan:{name:'Fan',copy:'Preview an air-circulation setting. Fan operation and speed support depend on the thermostat and connected equipment.'}};
 const equipment={
  'fan-coil':{name:'Fan-coil / room AC',copy:"A useful starting point is the equipment’s wiring diagram. Room air conditioners and fan-coil units can use different control methods.",list:['Unit make, model and wiring diagram','Control input, fan speeds and valve arrangement','Power supply, installation box and required functions']},
  'electric-floor':{name:'Electric floor heating',copy:'Review the heating installation and sensing requirements before selecting the thermostat. Electrical ratings must match the installation design.',list:['Heating system make, model and electrical load','Floor sensor type and temperature requirements','Power supply, wall-box information and wiring diagram']},
  'water-heating':{name:'Water-based heating',copy:'Review how the room thermostat will operate the heating equipment. Zoning, valves and actuator arrangements need a model-specific check.',list:['Heating equipment and zone layout','Valve or actuator type and control voltage','Wiring diagram and installation requirements']}
 };
 const projects={
  new:{name:'New Build',title:'Prepare your new-build brief',copy:'Plan room zones and equipment connections early, before the controls are specified.',list:['Room and zone schedule with preferred functions','Planned equipment models and control wiring','Wall-box information, finishes and target schedule']},
  renovation:{name:'Renovation',title:'Prepare your renovation brief',copy:'Review the existing equipment and installation before choosing replacement controls.',list:['Existing thermostat and equipment model photos','Existing wiring diagrams, power supply and wall-box details','Functions to change and preferred replacement finishes']},
  commercial:{name:'Commercial Project',title:'Prepare your commercial project brief',copy:'Share the zone schedule and equipment architecture so room controls can be reviewed together.',list:['Zone schedule, room use and required operating modes','Equipment models, wiring and any control system requirements','Project stages, expected quantities and target schedule']}
 };
 let currentRoom='living';let currentEquipment='fan-coil';let currentProject='new';
 function setList(selector,values){const list=query(selector);const items=values.map(value=>{const li=document.createElement('li');li.textContent=value;return li;});list.replaceChildren(...items);}
 function updateInquiry(){const room=rooms[currentRoom];const setting=room.mode==='fan'?'Fan':modes[room.mode].name+' '+room.temperature.toFixed(1)+'°C';const params=new URLSearchParams({application:'hvac-climate-control',focus:room.name+' · '+setting+' · '+equipment[currentEquipment].name,project:projects[currentProject].name});query('[data-application-inquiry]').href='request-a-quote.html?'+params.toString();}
 function renderTemperature(announce=false){
  const room=rooms[currentRoom];const fan=room.mode==='fan';
  const output=query('[data-climate-temperature]');
  output.replaceChildren(document.createTextNode(fan?'Fan':room.temperature.toFixed(1)));
  if(!fan){const unit=document.createElement('span');unit.textContent='°C';output.append(unit);}
  text('[data-climate-dial-caption]',fan?'Air circulation preview':'Temperature preference');
  text('[data-climate-range]',fan?'No temperature setpoint in this preview':'16–30°C · 0.5°C steps');
  query('[data-climate-dial]').style.setProperty('--dial',fan?'0%':(((room.temperature-16)/14)*75).toFixed(2)+'%');
  all('[data-climate-adjust]').forEach(button=>{const delta=Number(button.dataset.climateAdjust);button.disabled=fan||(delta<0&&room.temperature<=16)||(delta>0&&room.temperature>=30);});
  all('[data-climate-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.climateMode===room.mode)));
  text('[data-climate-mode-description]',modes[room.mode].copy);
  const summary=room.name+' · '+modes[room.mode].name+(fan?'':' · '+room.temperature.toFixed(1)+'°C');
  text('[data-climate-summary]',summary);updateInquiry();
  if(announce)text('[data-application-status]',summary+'. Control preview only.');
 }
 function selectRoom(key,announce=true){
  if(!rooms[key])return;currentRoom=key;const room=rooms[key];
  all('[data-climate-room]').forEach(button=>{const active=button.dataset.climateRoom===key;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active)query('#climate-room-panel').setAttribute('aria-labelledby',button.id);});
  const photo=query('[data-climate-photo]');const asset='assets/images/applications/'+(room.base||'residential')+'/'+room.photo;
  photo.src=asset+'-1400.webp';photo.srcset=asset+'-900.webp 900w, '+asset+'-1400.webp 1400w';photo.alt=room.alt;
  text('[data-climate-title]',room.name);text('[data-climate-caption]',room.name);text('[data-climate-description]',room.description);renderTemperature(announce);
 }
 function selectEquipment(key,announce=true){if(!equipment[key])return;currentEquipment=key;const item=equipment[key];all('[data-climate-equipment]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.climateEquipment===key)));text('[data-climate-equipment-title]',item.name);text('[data-climate-equipment-copy]',item.copy);setList('[data-climate-equipment-list]',item.list);updateInquiry();if(announce)text('[data-application-status]',item.name+'. '+item.copy);}
 function selectProject(key,announce=true){if(!projects[key])return;currentProject=key;const item=projects[key];all('[data-climate-project]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.climateProject===key)));text('[data-climate-project-title]',item.title);text('[data-climate-project-copy]',item.copy);setList('[data-climate-project-list]',item.list);updateInquiry();if(announce)text('[data-application-status]',item.title+'. '+item.copy);}
 const tabs=all('[data-climate-room]');tabs.forEach((button,index)=>{button.addEventListener('click',()=>selectRoom(button.dataset.climateRoom));button.addEventListener('keydown',event=>{let target;if(event.key==='ArrowRight')target=(index+1)%tabs.length;if(event.key==='ArrowLeft')target=(index+tabs.length-1)%tabs.length;if(event.key==='Home')target=0;if(event.key==='End')target=tabs.length-1;if(target===undefined)return;event.preventDefault();selectRoom(tabs[target].dataset.climateRoom);tabs[target].focus();});});
 all('[data-climate-adjust]').forEach(button=>button.addEventListener('click',()=>{const room=rooms[currentRoom];if(room.mode==='fan')return;room.temperature=Math.max(16,Math.min(30,room.temperature+Number(button.dataset.climateAdjust)));renderTemperature(true);}));
 all('[data-climate-mode]').forEach(button=>button.addEventListener('click',()=>{if(!modes[button.dataset.climateMode])return;rooms[currentRoom].mode=button.dataset.climateMode;renderTemperature(true);}));
 all('[data-climate-equipment]').forEach(button=>button.addEventListener('click',()=>selectEquipment(button.dataset.climateEquipment)));
 all('[data-climate-project]').forEach(button=>button.addEventListener('click',()=>selectProject(button.dataset.climateProject)));
 selectRoom('living',false);selectEquipment('fan-coil',false);selectProject('new',false);
 document.querySelector('[data-menu="applications"]')?.classList.add('is-current');
})();
