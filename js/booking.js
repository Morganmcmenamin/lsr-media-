/**
 * LSR Media - Booking System JavaScript
 * Premium Week Calendar with Google Calendar Integration via n8n
 */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================

  const CONFIG = {
    // n8n Webhook URLs
    webhooks: {
      getAvailability: 'https://morganmc.app.n8n.cloud/webhook-test/8e3eeb1c-0c98-4271-9ef7-71d9d04456d7',
      createBooking: 'YOUR_N8N_WEBHOOK_URL_FOR_CREATE_BOOKING'
    },
    // Booking hours: 8am - 6pm (5 slots per day)
    slots: [
      { start: '08:00', end: '10:00', label: '8-10am' },
      { start: '10:00', end: '12:00', label: '10am-12pm' },
      { start: '12:00', end: '14:00', label: '12-2pm' },
      { start: '14:00', end: '16:00', label: '2-4pm' },
      { start: '16:00', end: '18:00', label: '4-6pm' }
    ],
    // Booking window: 4 weeks ahead
    maxWeeksAhead: 4,
    // Timezone
    timezone: 'Pacific/Auckland',
    // Days of the week
    dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    // Business days (0 = Sunday, 6 = Saturday)
    businessDays: [1, 2, 3, 4, 5, 6] // Mon-Sat
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
  let currentWeekStart = getWeekStart(new Date());
  let selectedSlot = null;
  let availableSlots = new Map(); // Map of "YYYY-MM-DD" -> Set of available slot start times

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

  // Calendar Elements
  const calendarEl = document.getElementById('week-calendar');
  const calendarTitle = document.getElementById('calendar-title');
  const calendarGrid = document.getElementById('calendar-grid');
  const calendarLoading = document.getElementById('calendar-loading');
  const calendarError = document.getElementById('calendar-error');
  const prevWeekBtn = document.getElementById('prev-week');
  const nextWeekBtn = document.getElementById('next-week');
  const selectedSlotDisplay = document.getElementById('selected-slot-display');
  const selectedSlotText = document.getElementById('selected-slot-text');
  const clearSelectionBtn = document.getElementById('clear-selection');
  const selectedSlotInput = document.getElementById('selected-slot');
  const retryBtn = document.getElementById('retry-load');

  // ============================================
  // Utility Functions
  // ============================================

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDateDisplay(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  function formatWeekTitle(weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startMonth = weekStart.toLocaleString('default', { month: 'short' });
    const endMonth = weekEnd.toLocaleString('default', { month: 'short' });

    if (startMonth === endMonth) {
      return `${startMonth} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
    }
    return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  }

  function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function isPastSlot(date, slotStart) {
    const now = new Date();
    const [hours, minutes] = slotStart.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate <= now;
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // ============================================
  // Calendar Rendering
  // ============================================

  function renderCalendar() {
    if (!calendarGrid) return;

    // Update title
    if (calendarTitle) {
      calendarTitle.textContent = formatWeekTitle(currentWeekStart);
    }

    // Update navigation buttons
    updateNavButtons();

    // Build grid HTML
    const gridInner = document.createElement('div');
    gridInner.className = 'calendar-grid-inner';

    // Generate day headers
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(currentWeekStart, i);
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';

      if (isToday(dayDate)) {
        dayHeader.classList.add('today');
      }
      if (isPastDate(dayDate)) {
        dayHeader.classList.add('past');
      }

      dayHeader.innerHTML = `
        <span class="calendar-day-name">${CONFIG.dayNames[dayDate.getDay()]}</span>
        <span class="calendar-day-date">${dayDate.getDate()}</span>
      `;
      gridInner.appendChild(dayHeader);
    }

    // Generate time slots for each day
    CONFIG.slots.forEach(slot => {
      for (let i = 0; i < 7; i++) {
        const dayDate = addDays(currentWeekStart, i);
        const dateStr = formatDate(dayDate);
        const slotEl = document.createElement('button');
        slotEl.type = 'button';
        slotEl.className = 'calendar-slot';
        slotEl.innerHTML = `<span class="slot-time">${slot.label}</span>`;

        const dayOfWeek = dayDate.getDay();
        const isBusinessDay = CONFIG.businessDays.includes(dayOfWeek);
        const isPast = isPastDate(dayDate) || isPastSlot(dayDate, slot.start);
        const daySlots = availableSlots.get(dateStr);
        const isAvailable = daySlots && daySlots.has(slot.start);

        if (!isBusinessDay || isPast) {
          slotEl.classList.add('past');
          slotEl.disabled = true;
        } else if (isAvailable) {
          slotEl.classList.add('available');
          slotEl.dataset.date = dateStr;
          slotEl.dataset.start = slot.start;
          slotEl.dataset.end = slot.end;
          slotEl.dataset.label = slot.label;

          // Check if this is the selected slot
          if (selectedSlot &&
              selectedSlot.date === dateStr &&
              selectedSlot.start === slot.start) {
            slotEl.classList.add('selected');
          }

          slotEl.addEventListener('click', () => selectSlot(dateStr, slot));
        } else {
          slotEl.classList.add('unavailable');
          slotEl.disabled = true;
        }

        gridInner.appendChild(slotEl);
      }
    });

    // Clear and append
    calendarGrid.innerHTML = '';
    calendarGrid.appendChild(gridInner);
  }

  function updateNavButtons() {
    const today = new Date();
    const thisWeekStart = getWeekStart(today);
    const maxWeekStart = addDays(thisWeekStart, CONFIG.maxWeeksAhead * 7);

    if (prevWeekBtn) {
      prevWeekBtn.disabled = currentWeekStart <= thisWeekStart;
    }

    if (nextWeekBtn) {
      nextWeekBtn.disabled = currentWeekStart >= maxWeekStart;
    }
  }

  function showLoading() {
    if (calendarLoading) calendarLoading.style.display = '';
    if (calendarGrid) calendarGrid.style.display = 'none';
    if (calendarError) calendarError.style.display = 'none';
  }

  function showError() {
    if (calendarLoading) calendarLoading.style.display = 'none';
    if (calendarGrid) calendarGrid.style.display = 'none';
    if (calendarError) calendarError.style.display = '';
  }

  function showCalendar() {
    if (calendarLoading) calendarLoading.style.display = 'none';
    if (calendarGrid) calendarGrid.style.display = '';
    if (calendarError) calendarError.style.display = 'none';
  }

  // ============================================
  // Slot Selection
  // ============================================

  function selectSlot(dateStr, slot) {
    selectedSlot = {
      date: dateStr,
      start: slot.start,
      end: slot.end,
      label: slot.label
    };

    // Update hidden input
    if (selectedSlotInput) {
      selectedSlotInput.value = JSON.stringify(selectedSlot);
    }

    // Update display
    updateSelectedSlotDisplay();

    // Re-render calendar to update selection state
    renderCalendar();
  }

  function clearSelectedSlot() {
    selectedSlot = null;
    if (selectedSlotInput) {
      selectedSlotInput.value = '';
    }
    updateSelectedSlotDisplay();
    renderCalendar();
  }

  function updateSelectedSlotDisplay() {
    if (!selectedSlotDisplay) return;

    if (selectedSlot) {
      const date = new Date(selectedSlot.date + 'T00:00:00');
      const dayName = CONFIG.dayNames[date.getDay()];
      const formattedDate = formatDateDisplay(date);

      if (selectedSlotText) {
        selectedSlotText.textContent = `${dayName}, ${formattedDate} at ${selectedSlot.label}`;
      }
      selectedSlotDisplay.style.display = '';
    } else {
      selectedSlotDisplay.style.display = 'none';
    }
  }

  // ============================================
  // n8n Integration - Fetch Availability
  // ============================================

  async function fetchAvailability() {
    showLoading();

    const weekEnd = addDays(currentWeekStart, 6);
    const startDate = formatDate(currentWeekStart);
    const endDate = formatDate(weekEnd);

    // Check if we have a real webhook URL configured
    if (CONFIG.webhooks.getAvailability.startsWith('YOUR_')) {
      // Demo mode: simulate all slots as available
      console.log('Demo mode: Using simulated availability data');
      simulateAvailability();
      return;
    }

    try {
      const url = `${CONFIG.webhooks.getAvailability}?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      processAvailabilityData(data);
      showCalendar();
      renderCalendar();
    } catch (error) {
      console.error('Error fetching availability:', error);
      // Fallback to demo mode on error
      console.log('Falling back to demo mode due to error');
      simulateAvailability();
    }
  }

  function processAvailabilityData(data) {
    availableSlots.clear();

    if (data.slots && Array.isArray(data.slots)) {
      data.slots.forEach(slot => {
        const dateKey = slot.date;
        if (!availableSlots.has(dateKey)) {
          availableSlots.set(dateKey, new Set());
        }
        availableSlots.get(dateKey).add(slot.start);
      });
    }
  }

  function simulateAvailability() {
    // For demo/development: mark most slots as available
    availableSlots.clear();

    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(currentWeekStart, i);
      const dateStr = formatDate(dayDate);
      const dayOfWeek = dayDate.getDay();

      // Skip Sundays (day 0) in simulation
      if (dayOfWeek === 0) continue;

      const daySlots = new Set();

      CONFIG.slots.forEach((slot, index) => {
        // Simulate some slots being unavailable (random pattern for demo)
        const hash = (dayDate.getDate() + index) % 5;
        if (hash !== 0) { // ~80% availability
          daySlots.add(slot.start);
        }
      });

      availableSlots.set(dateStr, daySlots);
    }

    showCalendar();
    renderCalendar();
  }

  // ============================================
  // n8n Integration - Create Booking
  // ============================================

  async function createBooking(bookingData) {
    // Check if we have a real webhook URL configured
    if (CONFIG.webhooks.createBooking.startsWith('YOUR_')) {
      // Demo mode: simulate successful booking
      console.log('Demo mode: Simulating booking creation', bookingData);
      return { success: true, message: 'Demo booking created' };
    }

    try {
      const response = await fetch(CONFIG.webhooks.createBooking, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
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

  // Calendar navigation
  prevWeekBtn?.addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, -7);
    fetchAvailability();
  });

  nextWeekBtn?.addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, 7);
    fetchAvailability();
  });

  // Clear selection
  clearSelectionBtn?.addEventListener('click', clearSelectedSlot);

  // Retry loading
  retryBtn?.addEventListener('click', fetchAvailability);

  // Form submission
  bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate at least one service selected
    if (selectedServices.size === 0) {
      alert('Please select at least one service.');
      return;
    }

    // Validate slot selected
    if (!selectedSlot) {
      alert('Please select a time slot from the calendar.');
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
      slot: selectedSlot,
      propertyAddress: formData.get('address'),
      propertySize: formData.get('size'),
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

    // Disable submit button while processing
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
    }

    try {
      // Create booking via n8n
      await createBooking(bookingData);

      // Show success message
      bookingForm.style.display = 'none';
      successMessage?.classList.add('visible');

      // Reset state
      selectedServices.clear();
      isLargeProperty = false;
      selectedSlot = null;
      cartBar?.classList.remove('visible');
    } catch (error) {
      alert('There was an error creating your booking. Please try again or contact us directly.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Booking Request';
      }
    }
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

    // Encode the address for use in URL
    const encodedAddress = encodeURIComponent(address + ', New Zealand');

    // Update the iframe src to show the location (using free embed)
    mapIframe.src = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  // Debounced address input handler
  addressInput?.addEventListener('input', (e) => {
    clearTimeout(mapUpdateTimeout);
    mapUpdateTimeout = setTimeout(() => {
      updateMap(e.target.value);
    }, 1000); // Wait 1 second after user stops typing
  });

  // Also update on blur (when user leaves the field)
  addressInput?.addEventListener('blur', (e) => {
    if (e.target.value.trim()) {
      updateMap(e.target.value);
    }
  });

  // ============================================
  // Initialize
  // ============================================

  function init() {
    handleUrlParams();

    // Initialize calendar if present
    if (calendarEl) {
      fetchAvailability();
    }
  }

  init();

})();
