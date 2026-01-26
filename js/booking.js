/**
 * LSR Media - Booking System JavaScript
 */

(function() {
  'use strict';

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
  const successMessage = document.querySelector('.success-message');

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

    // Create sorted key for bundle lookup
    const sortedServices = Array.from(selectedServices).sort();
    const bundleKey = sortedServices.join(',');

    // Calculate prices
    const fullPrice = sortedServices.reduce((sum, id) => sum + services[id].price, 0);
    const bundlePrice = bundlePrices[bundleKey] || fullPrice;

    // Calculate large property surcharge
    let surcharge = 0;
    if (isLargeProperty && (selectedServices.has('floorplan') || selectedServices.has('virtualtour'))) {
      surcharge = 50;
    }

    const finalPrice = bundlePrice + surcharge;
    const savings = fullPrice - bundlePrice;

    // Update cart services display
    if (cartServicesEl) {
      cartServicesEl.innerHTML = sortedServices
        .map(id => `<span>${services[id].name}</span>`)
        .join('');
    }

    // Update pricing display
    if (cartOriginalEl) {
      if (savings > 0 || surcharge > 0) {
        cartOriginalEl.textContent = `$${fullPrice + surcharge}`;
        cartOriginalEl.style.display = '';
      } else {
        cartOriginalEl.style.display = 'none';
      }
    }

    if (cartBundleEl) {
      cartBundleEl.textContent = `$${finalPrice}`;
    }

    if (cartSavingsEl) {
      if (savings > 0) {
        cartSavingsEl.textContent = `You save $${savings}!`;
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

  // Form submission
  bookingForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate at least one service selected
    if (selectedServices.size === 0) {
      alert('Please select at least one service.');
      return;
    }

    // Gather form data
    const formData = new FormData(bookingForm);
    const bookingData = {
      services: Array.from(selectedServices).map(id => ({
        id,
        name: services[id].name,
        price: services[id].price
      })),
      isLargeProperty,
      propertyAddress: formData.get('address'),
      propertySize: formData.get('size'),
      preferredDate: formData.get('date'),
      preferredTime: formData.get('time'),
      fullName: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      notes: formData.get('notes')
    };

    // Calculate final pricing
    const sortedServices = Array.from(selectedServices).sort();
    const bundleKey = sortedServices.join(',');
    const fullPrice = sortedServices.reduce((sum, id) => sum + services[id].price, 0);
    const bundlePrice = bundlePrices[bundleKey] || fullPrice;

    let surcharge = 0;
    if (isLargeProperty && (selectedServices.has('floorplan') || selectedServices.has('virtualtour'))) {
      surcharge = 50;
    }

    bookingData.pricing = {
      fullPrice,
      bundlePrice,
      surcharge,
      finalPrice: bundlePrice + surcharge,
      savings: fullPrice - bundlePrice
    };

    // Log to console (for development)
    console.log('Booking Submitted:', bookingData);

    // Show success message
    bookingForm.style.display = 'none';
    successMessage?.classList.add('visible');

    // Reset state
    selectedServices.clear();
    isLargeProperty = false;
    cartBar?.classList.remove('visible');
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

  // Initialize
  handleUrlParams();

})();
