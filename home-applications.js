(function () {
  'use strict';

  var section = document.querySelector('[data-home-applications]');
  if (!section) return;

  var applications = {
    residential: {
      name: 'Residential',
      kicker: 'Featured application · Residential',
      title: 'Smarter living starts at home',
      shortTitle: 'Residential',
      description: 'Lighting control · Room comfort · Everyday convenience',
      image: 'assets/images/home/applications-residential-20261013.webp',
      imageAlt: 'Contemporary coastal living room with warm natural materials and an ocean view',
      href: 'applications-residential.html',
      browseLabel: 'Explore Residential',
      panelTitle: 'Product options for your home',
      panelDescription: 'Explore switches, sensors and climate controls for everyday spaces.',
      products: [
        { label: 'Smart switches', image: 'assets/images/home/featured-v2-smart-touch-switch.png', href: 'smart-switches.html' },
        { label: 'Sensors', image: 'assets/images/home/featured-presence-sensor-render-v1.webp', href: 'sensors.html' },
        { label: 'Thermostats', image: 'assets/images/home/featured-thermostat-render-v1.png', href: 'thermostats.html' }
      ]
    },
    hospitality: {
      name: 'Hospitality',
      kicker: 'Hotel & guestroom control',
      title: 'Thoughtful control for every stay',
      shortTitle: 'Hospitality',
      description: 'Guestroom scenes · Access control · Room comfort',
      image: 'assets/images/home/applications-hospitality-20261013.webp',
      imageAlt: 'Warm contemporary hotel guestroom with a comfortable bed and layered lighting',
      href: 'applications-hotels-guest-rooms.html',
      browseLabel: 'Explore Hospitality',
      panelTitle: 'Product options for guestrooms',
      panelDescription: 'Explore switches, door access and climate products for hospitality projects.',
      products: [
        { label: 'Smart switches', image: 'assets/images/home/featured-v2-smart-touch-switch.png', href: 'smart-switches.html' },
        { label: 'Smart door locks', image: 'assets/images/home/featured-rfid-lock-render-v1.webp', href: 'smart-door-locks.html' },
        { label: 'Thermostats', image: 'assets/images/home/featured-thermostat-render-v1.png', href: 'thermostats.html' }
      ]
    },
    commercial: {
      name: 'Commercial',
      kicker: 'Office & commercial spaces',
      title: 'Connected controls for working spaces',
      shortTitle: 'Commercial offices',
      description: 'Lighting control · Occupancy sensing · Connected systems',
      image: 'assets/images/home/applications-commercial-20261013.webp',
      imageAlt: 'Bright modern commercial office with glass meeting rooms and open workstations',
      href: 'applications-offices.html',
      browseLabel: 'Explore Offices',
      panelTitle: 'Product options for working spaces',
      panelDescription: 'Explore sensors, controllers and switches around your project needs.',
      products: [
        { label: 'Sensors', image: 'assets/images/home/featured-presence-sensor-render-v1.webp', href: 'sensors.html' },
        { label: 'Controllers', image: 'assets/images/home/featured-control-module-render-v1.webp', href: 'controllers.html' },
        { label: 'Smart switches', image: 'assets/images/home/featured-v2-smart-touch-switch.png', href: 'smart-switches.html' }
      ]
    }
  };

  var order = ['residential', 'hospitality', 'commercial'];
  var tabs = Array.prototype.slice.call(section.querySelectorAll('[data-ha-apps-tab]'));
  var cards = Array.prototype.slice.call(section.querySelectorAll('[data-ha-apps-card]'));
  var panel = section.querySelector('[data-ha-apps-panel]');
  var productNodes = Array.prototype.slice.call(section.querySelectorAll('[data-ha-apps-product]'));
  var status = section.querySelector('[data-ha-apps-status]');
  var mobile = window.matchMedia('(max-width:900px)');
  var currentKey = 'all';

  function renderCard(card, key, isMain) {
    var app = applications[key];
    var image = card.querySelector('[data-ha-apps-image]');
    var select = card.querySelector('[data-ha-apps-scene]');
    var link = card.querySelector('[data-ha-apps-explore]');

    image.src = app.image;
    image.alt = app.imageAlt;
    card.querySelector('[data-ha-apps-kicker]').textContent = app.kicker;
    card.querySelector('[data-ha-apps-title]').textContent = isMain ? app.title : app.shortTitle;
    card.querySelector('[data-ha-apps-description]').textContent = app.description;
    select.dataset.haAppsScene = key;
    select.setAttribute('aria-label', 'Show ' + app.name.toLowerCase() + ' product combination');
    select.setAttribute('aria-pressed', String(isMain));
    link.href = app.href;
    link.querySelector('span').textContent = app.browseLabel;
  }

  function selectApplication(key, announce) {
    if (key !== 'all' && !applications[key]) return;
    if (key === 'all' && mobile.matches) key = 'residential';
    currentKey = key;
    var mainKey = key === 'all' ? 'residential' : key;
    var app = applications[mainKey];
    var displayOrder = [mainKey].concat(order.filter(function (item) { return item !== mainKey; }));

    tabs.forEach(function (tab) {
      var selected = tab.dataset.haAppsTab === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) panel.setAttribute('aria-labelledby', tab.id);
    });
    cards.forEach(function (card, index) { renderCard(card, displayOrder[index], index === 0); });
    section.querySelector('[data-ha-apps-panel-kicker]').textContent = 'Typical configuration · ' + app.name;
    section.querySelector('[data-ha-apps-panel-title]').textContent = app.panelTitle;
    section.querySelector('[data-ha-apps-panel-description]').textContent = app.panelDescription;
    section.querySelector('[data-ha-apps-view]').href = app.href;
    section.querySelector('[data-ha-apps-view-label]').textContent = app.browseLabel;
    productNodes.forEach(function (node, index) {
      var product = app.products[index];
      var link = node.querySelector('a');
      var image = node.querySelector('img');
      link.href = product.href;
      image.src = product.image;
      image.alt = product.label;
      node.querySelector('[data-ha-apps-product-label]').textContent = product.label;
    });
    if (announce) {
      status.textContent = app.name + ': ' + app.products.map(function (product) { return product.label; }).join(', ') + '. Product links and the related product selection have been updated.';
    }
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectApplication(tab.dataset.haAppsTab, true); });
    tab.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectApplication(tabs[next].dataset.haAppsTab, true);
      tabs[next].focus();
    });
  });
  section.addEventListener('click', function (event) {
    var reset = event.target.closest('[data-ha-apps-reset]');
    if (reset && section.contains(reset)) {
      selectApplication('all', true);
      return;
    }
    var button = event.target.closest('[data-ha-apps-scene]');
    if (!button || !section.contains(button)) return;
    selectApplication(button.dataset.haAppsScene, true);
  });

  var requestedApplication = new URLSearchParams(window.location.search).get('application');
  selectApplication(Object.prototype.hasOwnProperty.call(applications, requestedApplication) ? requestedApplication : 'all', false);
  mobile.addEventListener('change', function () { selectApplication(currentKey, false); });
})();
