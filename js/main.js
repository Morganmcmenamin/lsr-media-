/**
 * LSR Media - Main JavaScript
 */

(function() {
  'use strict';

  // ============================================
  // DOM Elements
  // ============================================

  const header = document.querySelector('.header');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const mobileOverlay = document.querySelector('.mobile-overlay');
  const fadeElements = document.querySelectorAll('.fade-in');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  const lightbox = document.querySelector('.lightbox');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxContent = document.querySelector('.lightbox-content');

  // ============================================
  // Sticky Navigation
  // ============================================

  function handleScroll() {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Check on load

  // ============================================
  // Mobile Menu
  // ============================================

  function toggleMobileMenu() {
    hamburger?.classList.toggle('active');
    navLinks?.classList.toggle('active');
    mobileOverlay?.classList.toggle('active');
    document.body.style.overflow = navLinks?.classList.contains('active') ? 'hidden' : '';
  }

  function closeMobileMenu() {
    hamburger?.classList.remove('active');
    navLinks?.classList.remove('active');
    mobileOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', toggleMobileMenu);
  mobileOverlay?.addEventListener('click', closeMobileMenu);

  // Close menu when clicking nav links
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header?.offsetHeight || 80;
        const targetPosition = target.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ============================================
  // Scroll Animations (Intersection Observer)
  // ============================================

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach(el => observer.observe(el));

  // ============================================
  // Logo Carousel (Duplicate for Infinite Loop)
  // ============================================

  const logoTrack = document.querySelector('.logo-track');
  if (logoTrack) {
    const logos = logoTrack.innerHTML;
    logoTrack.innerHTML = logos + logos; // Duplicate for seamless loop
  }

  // ============================================
  // Portfolio Filter
  // ============================================

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      // Filter items
      portfolioItems.forEach(item => {
        const category = item.dataset.category;

        if (filter === 'all' || category === filter) {
          item.style.display = '';
          item.style.animation = 'fadeIn 0.5s ease';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // ============================================
  // Portfolio Lightbox
  // ============================================

  portfolioItems.forEach(item => {
    item.addEventListener('click', () => {
      const imgSrc = item.querySelector('img')?.src;
      const placeholder = item.querySelector('.portfolio-placeholder')?.textContent;

      if (lightboxContent) {
        if (imgSrc) {
          lightboxContent.innerHTML = `<img src="${imgSrc}" alt="Portfolio Image">`;
        } else {
          lightboxContent.innerHTML = `<div class="portfolio-placeholder" style="width:80vw;height:60vh;background:var(--color-dark-gray);display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:1.5rem;color:var(--color-light-gray);">${placeholder || 'Preview'}</div>`;
        }
      }

      lightbox?.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox?.classList.remove('active');
    document.body.style.overflow = '';
  }

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Close lightbox with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox?.classList.contains('active')) {
      closeLightbox();
    }
  });

  // ============================================
  // Set Active Nav Link
  // ============================================

  function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-links a').forEach(link => {
      const linkPage = link.getAttribute('href');
      if (linkPage === currentPage ||
          (currentPage === '' && linkPage === 'index.html') ||
          (currentPage === 'index.html' && linkPage === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  setActiveNavLink();

})();
