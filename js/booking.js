/**
 * LSR Media - Booking System JavaScript
 * Service selection, pricing, and Cal.com scheduling redirect
 */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================

  const CONFIG = {
    calComUrl: 'https://cal.com/morgan-mcmenamin-fxyxld/lsr-media-job'
  };

  // ============================================
  // Service Configuration
  // ============================================

  const services = {
    aerial: { name: 'Aerial Photography', price: 175 },
    floorplan: { name: '3D Floor Plan', price: 200 },
    reel: { name: 'Cinematic Reel', price: 240 },
    virtualtour: { name: 'Virtual Tour', price: 250 },
    photography: { name: 'Classic Photoshoot', price: 300 }
  };

  // Bundle Pricing Lookup Table (alphabetically sorted keys)
  const bundlePrices = {
    // Single services (no discount)
    'aerial': 175,
    'floorplan': 200,
    'photography': 300,
    'reel': 240,
    'virtualtour': 250,

    // 2-service bundles
    'aerial,floorplan': 300,
    'aerial,photography': 400,
    'aerial,reel': 350,
    'aerial,virtualtour': 350,
    'floorplan,photography': 425,
    'floorplan,reel': 375,
    'floorplan,virtualtour': 375,
    'photography,reel': 450,
    'photography,virtualtour': 475,
    'reel,virtualtour': 400,

    // 3-service bundles
    'aerial,floorplan,photography': 550,
    'aerial,floorplan,reel': 475,
    'aerial,floorplan,virtualtour': 500,
    'aerial,photography,reel': 550,
    'aerial,photography,virtualtour': 575,
    'aerial,reel,virtualtour': 525,
    'floorplan,photography,reel': 575,
    'floorplan,photography,virtualtour': 600,
    'floorplan,reel,virtualtour': 500,
    'photography,reel,virtualtour': 600,

    // 4-service bundles
    'aerial,floorplan,photography,reel': 700,
    'aerial,floorplan,photography,virtualtour': 725,
    'aerial,floorplan,reel,virtualtour': 650,
    'aerial,photography,reel,virtualtour': 725,
    'floorplan,photography,reel,virtualtour': 750,

    // 5-service bundle (complete package)
    'aerial,floorplan,photography,reel,virtualtour': 900
  };

  // ============================================
  // State
  // ============================================

  let selectedServices = new Set();
  let isLargeProperty = false;

  // ============================================
  // DOM Elements
  // ============================================

  const serviceCards = document.querySelectorAll('.booking-service-card');
  const cartBar = document.querySelector('.cart-bar');
  const cartServicesEl = document.querySelector('.cart-services');
  const cartOriginalEl = document.querySelector('.cart-original');
  const cartBundleEl = document.querySelector('.cart-bundle');
  const cartSavingsEl = document.querySelector('.cart-savings');
  const largePropertyCheckbox = document.getElementById('large-property');
  const bookingForm = document.getElementById('booking-form');

  // ============================================
  // Pricing Calculation
  // ============================================

  function calculatePricing() {
    const sortedServices = Array.from(selectedServices).sort();
    const bundleKey = sortedServices.join(',');
    const fullPrice = sortedServices.reduce((sum, id) => sum + services[id].price, 0);
    const bundlePrice = bundlePrices[bundleKey] || fullPrice;

    let surcharge = 0;
    if (isLargeProperty && (selectedServices.has('floorplan') || selectedServices.has('virtualtour'))) {
      surcharge = 50;
    }

    return {
      fullPrice,
      bundlePrice,
      surcharge,
      finalPrice: bundlePrice + surcharge,
      savings: fullPrice - bundlePrice
    };
  }

  // ============================================
  // Cal.com Redirect
  // ============================================

  function buildCalComUrl() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const sizeEl = document.getElementById('size');
    const propertySize = sizeEl.options[sizeEl.selectedIndex].text;
    const userNotes = document.getElementById('notes').value.trim();

    // Build service names list
    const sortedIds = Array.from(selectedServices).sort();
    const serviceNames = sortedIds.map(id => services[id].name);

    // Calculate pricing
    const pricing = calculatePricing();

    // Build structured notes
    let notesContent = `--- PROPERTY ---\n`;
    notesContent += `Address: ${address}\n`;
    notesContent += `Size: ${propertySize}\n`;
    notesContent += `Large Property: ${isLargeProperty ? 'Yes (+$50)' : 'No'}\n`;
    notesContent += `\n`;
    notesContent += `--- SERVICES ---\n`;
    notesContent += `${serviceNames.join(', ')}\n`;
    notesContent += `\n`;
    notesContent += `--- PRICING ---\n`;

    if (pricing.surcharge > 0) {
      notesContent += `Full Price: $${pricing.fullPrice}\n`;
      notesContent += `Bundle: $${pricing.bundlePrice} + $${pricing.surcharge} surcharge = $${pricing.finalPrice}\n`;
      notesContent += `Savings: $${pricing.savings}\n`;
    } else if (pricing.savings > 0) {
      notesContent += `Full Price: $${pricing.fullPrice}\n`;
      notesContent += `Bundle: $${pricing.bundlePrice}\n`;
      notesContent += `Savings: $${pricing.savings}\n`;
    } else {
      notesContent += `Total: $${pricing.finalPrice}\n`;
    }

    if (userNotes) {
      notesContent += `\n`;
      notesContent += `--- NOTES ---\n`;
      notesContent += userNotes;
    }

    // Build URL with parameters
    const params = new URLSearchParams({
      name: name,
      email: email,
      phone: phone,
      notes: notesContent
    });

    return `${CONFIG.calComUrl}?${params.toString()}`;
  }

  function validateForm() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();

    const errors = [];

    if (selectedServices.size === 0) {
      errors.push('Please select at least one service.');
    }
    if (!name) {
      errors.push('Please enter your full name.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address.');
    }
    if (!phone) {
      errors.push('Please enter your phone number.');
    }
    if (!address) {
      errors.push('Please enter the property address.');
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return false;
    }

    return true;
  }

  // ============================================
  // Service Selection
  // ============================================

  function toggleService(serviceId) {
    if (selectedServices.has(serviceId)) {
      selectedServices.delete(serviceId);
    } else {
      selectedServices.add(serviceId);
    }
    updateUI();
  }

  function updateUI() {
    // Update service card states
    serviceCards.forEach(card => {
      const serviceId = card.dataset.service;
      const btn = card.querySelector('.btn');

      if (selectedServices.has(serviceId)) {
        card.classList.add('selected');
        if (btn) btn.textContent = 'Remove';
      } else {
        card.classList.remove('selected');
        if (btn) btn.textContent = 'Add to Booking';
      }
    });

    // Update cart
    updateCart();
  }

  // ============================================
  // Cart Updates
  // ============================================

  function updateCart() {
    if (selectedServices.size === 0) {
      cartBar?.classList.remove('visible');
      return;
    }

    cartBar?.classList.add('visible');

    const pricing = calculatePricing();
    const sortedServices = Array.from(selectedServices).sort();

    // Update cart services display
    if (cartServicesEl) {
      cartServicesEl.innerHTML = sortedServices
        .map(id => `<span>${services[id].name}</span>`)
        .join('');
    }

    // Update pricing display
    if (cartOriginalEl) {
      if (pricing.savings > 0 || pricing.surcharge > 0) {
        cartOriginalEl.textContent = `$${pricing.fullPrice + pricing.surcharge}`;
        cartOriginalEl.style.display = '';
      } else {
        cartOriginalEl.style.display = 'none';
      }
    }

    if (cartBundleEl) {
      cartBundleEl.textContent = `$${pricing.finalPrice}`;
    }

    if (cartSavingsEl) {
      if (pricing.savings > 0) {
        cartSavingsEl.textContent = `You save $${pricing.savings}!`;
        cartSavingsEl.style.display = '';
      } else {
        cartSavingsEl.style.display = 'none';
      }
    }
  }

  // ============================================
  // Event Listeners
  // ============================================

  // Service card clicks
  serviceCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Prevent double-triggering if button is clicked
      if (e.target.classList.contains('btn')) return;
      toggleService(card.dataset.service);
    });

    // Button clicks within cards
    const btn = card.querySelector('.btn');
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleService(card.dataset.service);
    });
  });

  // Large property checkbox
  largePropertyCheckbox?.addEventListener('change', (e) => {
    isLargeProperty = e.target.checked;
    updateCart();
  });

  // Form submission -> redirect to Cal.com
  bookingForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const calComUrl = buildCalComUrl();
    window.location.href = calComUrl;
  });

  // ============================================
  // URL Parameter Handling
  // ============================================

  function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('service');

    if (preselect && services[preselect]) {
      selectedServices.add(preselect);
      updateUI();
    }
  }

  // ============================================
  // Google Maps Integration
  // ============================================

  const addressInput = document.getElementById('address');
  const mapIframe = document.getElementById('property-map');
  let mapUpdateTimeout;

  function updateMap(address) {
    if (!mapIframe || !address.trim()) return;

    const encodedAddress = encodeURIComponent(address + ', New Zealand');
    mapIframe.src = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  // Debounced address input handler
  addressInput?.addEventListener('input', (e) => {
    clearTimeout(mapUpdateTimeout);
    mapUpdateTimeout = setTimeout(() => {
      updateMap(e.target.value);
    }, 1000);
  });

  addressInput?.addEventListener('blur', (e) => {
    if (e.target.value.trim()) {
      updateMap(e.target.value);
    }
  });

  // ============================================
  // Initialize
  // ============================================

  handleUrlParams();

})();
