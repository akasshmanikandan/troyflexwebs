/* -------------------------------------------------------------
 * Troyflex Website JavaScript Engines
 * Dynamic mesh canvas background, responsive slider budgets,
 * category grid filtering, state-driven step mockups, and
 * AJAX contact systems with premium visual feedback.
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. Dynamic Mesh Canvas Background (Spatial Particle Engine)
  // ==========================================
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Handle Resize
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(60, Math.floor((width * height) / 25000)); // Dynamic density
    const mouse = { x: null, y: null, targetX: null, targetY: null, radius: 180 };

    // Mouse Move Tracker
    window.addEventListener('mousemove', (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      mouse.targetX = null;
      mouse.targetY = null;
    });

    // Particle Blueprint
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? 'rgba(157, 78, 221, 0.4)' : 'rgba(0, 245, 212, 0.3)';
      }

      update() {
        // Move boundaries
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        this.x += this.vx;
        this.y += this.vy;

        // Magnet attraction toward mouse coordinates
        if (mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= dx * force * 0.02;
            this.y -= dy * force * 0.02;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation Loop
    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse easing
      if (mouse.targetX !== null) {
        if (mouse.x === null) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.08;
          mouse.y += (mouse.targetY - mouse.y) * 0.08;
        }
      } else {
        mouse.x = null;
        mouse.y = null;
      }

      // Draw subtle mouse background glow aura
      if (mouse.x !== null) {
        const radGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, mouse.radius);
        radGrad.addColorStop(0, 'rgba(157, 78, 221, 0.06)');
        radGrad.addColorStop(0.5, 'rgba(0, 245, 212, 0.03)');
        radGrad.addColorStop(1, 'rgba(7, 5, 15, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update & Draw particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Connect lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (100 - dist) / 100 * 0.12;
            ctx.strokeStyle = `rgba(157, 78, 221, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }
    animate();
  }

  // ==========================================
  // 2. Scroll Progress Bar Indicator
  // ==========================================
  const progressBar = document.getElementById('scroll-progress');
  const navHeader = document.getElementById('main-nav');

  window.addEventListener('scroll', () => {
    // Progress Width
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    if (progressBar) {
      progressBar.style.width = scrollPercent + '%';
    }

    // Shrink Nav Header on scroll past 50px
    if (navHeader) {
      if (scrollTop > 50) {
        navHeader.classList.add('navbar-scrolled');
      } else {
        navHeader.classList.remove('navbar-scrolled');
      }
    }
  });

  // ==========================================
  // 3. Mobile Navigation Menu Toggle
  // ==========================================
  const toggleBtn = document.getElementById('menu-toggle-btn');
  const navOverlay = document.getElementById('mobile-nav-overlay');
  const overlayItems = document.querySelectorAll('.mobile-nav-item');

  if (toggleBtn && navOverlay) {
    function toggleMobileMenu() {
      toggleBtn.classList.toggle('open');
      navOverlay.classList.toggle('open');
      document.body.classList.toggle('no-scroll');
    }

    toggleBtn.addEventListener('click', toggleMobileMenu);

    // Close on link clicks
    overlayItems.forEach(item => {
      item.addEventListener('click', () => {
        if (navOverlay.classList.contains('open')) {
          toggleMobileMenu();
        }
      });
    });
  }

  // ==========================================
  // 4. Scroll-Driven Reveal System (Fade-Ins)
  // ==========================================
  const revealElements = document.querySelectorAll('.reveal-fade, .reveal-fade-right');
  
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          observer.unobserve(entry.target); // Trigger only once
        }
      });
    }, {
      root: null,
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if not supported
    revealElements.forEach(el => el.classList.add('reveal-active'));
  }

  // ==========================================
  // 5. Interactive Process Timelines Dashboard
  // ==========================================
  const stepItems = document.querySelectorAll('.process-step-item');
  const mockupContainer = document.getElementById('process-mockup-body');

  const stepVisualData = {
    1: `
      <div class="mockup-step-content reveal-fade reveal-active">
        <div class="mockup-inner-header">
          <h4>Discover & Strategy Phase</h4>
          <span class="mockup-status-badge green-bg">In Analysis</span>
        </div>
        <div class="mockup-chart-dummy">
          <div class="chart-bar" style="height: 40%"></div>
          <div class="chart-bar" style="height: 65%"></div>
          <div class="chart-bar" style="height: 90%"></div>
          <div class="chart-bar" style="height: 55%"></div>
        </div>
        <div class="mockup-metrics">
          <div class="m-item"><span>Competitors Scraped</span><strong>14 Brands</strong></div>
          <div class="m-item"><span>Primary Keywords Mapped</span><strong>32 High Intent</strong></div>
        </div>
      </div>
    `,
    2: `
      <div class="mockup-step-content reveal-fade reveal-active">
        <div class="mockup-inner-header">
          <h4>Figma Design & Wireframing</h4>
          <span class="mockup-status-badge purple-bg-badge">Mockups Approved</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.02); height: 100px; border-radius: var(--border-radius-sm); border: 1.5px dashed var(--color-purple); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 0.85rem; color: var(--color-purple);">
          📐 3 Custom Concept Prototypes Made
        </div>
        <div class="mockup-metrics">
          <div class="m-item"><span>Mobile Views Mapped</span><strong>100% Fully Responsive</strong></div>
          <div class="m-item"><span>Brand Assets Structured</span><strong>Outfit + Inter Type</strong></div>
        </div>
      </div>
    `,
    3: `
      <div class="mockup-step-content reveal-fade reveal-active">
        <div class="mockup-inner-header">
          <h4>Active Engine Coding</h4>
          <span class="mockup-status-badge green-bg">Compiling Assets</span>
        </div>
        <div class="mockup-chart-dummy">
          <div class="chart-bar" style="height: 95%"></div>
          <div class="chart-bar" style="height: 98%"></div>
          <div class="chart-bar" style="height: 100%"></div>
          <div class="chart-bar" style="height: 97%"></div>
        </div>
        <div class="mockup-metrics">
          <div class="m-item"><span>Next.js Static Pages Build</span><strong>Flawless Compile</strong></div>
          <div class="m-item"><span>Total Asset Bundle Size</span><strong>&lt; 140KB (Ultra Compact)</strong></div>
        </div>
      </div>
    `,
    4: `
      <div class="mockup-step-content reveal-fade reveal-active">
        <div class="mockup-inner-header">
          <h4>Meticulous Performance Check</h4>
          <span class="mockup-status-badge green-bg">Live Monitoring</span>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <div style="flex-grow: 1; border: var(--border-glass); border-radius: 8px; padding: 12px; text-align: center;">
            <span style="font-size: 1.8rem; font-weight: 800; color: var(--color-green);">100</span>
            <p style="font-size: 0.65rem; color: var(--text-gray-500);">MOBILE SPEED</p>
          </div>
          <div style="flex-grow: 1; border: var(--border-glass); border-radius: 8px; padding: 12px; text-align: center;">
            <span style="font-size: 1.8rem; font-weight: 800; color: var(--color-teal);">0.2s</span>
            <p style="font-size: 0.65rem; color: var(--text-gray-500);">LCP DELAY</p>
          </div>
        </div>
        <div class="mockup-metrics">
          <div class="m-item"><span>Vercel Cloud Node Mapping</span><strong>Successfully Deployed</strong></div>
          <div class="m-item"><span>Daily offsite Backup Schedule</span><strong>Configured Active</strong></div>
        </div>
      </div>
    `
  };

  stepItems.forEach(item => {
    item.addEventListener('click', () => {
      // Toggle Active step list classes
      stepItems.forEach(el => el.classList.remove('active-step'));
      item.classList.add('active-step');

      const stepNum = item.getAttribute('data-step');
      
      // Update Mockup Box with custom html
      if (mockupContainer && stepVisualData[stepNum]) {
        mockupContainer.innerHTML = stepVisualData[stepNum];
      }
    });
  });

  // ==========================================
  // 6. Filterable Portfolio Case Studies
  // ==========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Button highlighting toggle
      filterBtns.forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');

      const cat = btn.getAttribute('data-category');

      // Grid Display filter logic
      projectCards.forEach(card => {
        const cardCats = card.getAttribute('data-category').split(' ');
        
        if (cat === 'all' || cardCats.includes(cat)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // ==========================================
  // 7. Live Numeric Stats Counter (Scroll Trigger)
  // ==========================================
  const counterTriggers = document.querySelectorAll('.counter-trigger');
  let statsTriggered = false;

  function runStatsCounters() {
    counterTriggers.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      const speed = target > 50 ? 25 : 60; // relative pace
      let count = 0;

      const updateCount = () => {
        const inc = Math.ceil(target / speed);
        count += inc;

        if (count < target) {
          counter.innerText = count;
          setTimeout(updateCount, 30);
        } else {
          counter.innerText = target;
        }
      };

      updateCount();
    });
  }

  if (counterTriggers.length > 0 && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsTriggered) {
          statsTriggered = true;
          runStatsCounters();
        }
      });
    }, { threshold: 0.3 });

    // Track the stats grids container
    const statsContainer = document.querySelector('.about-stats-grid');
    if (statsContainer) statsObserver.observe(statsContainer);
  }

  // ==========================================
  // 8. Auto-select Plan
  // ==========================================
  const planCTAs = document.querySelectorAll('.start-project-plan');
  planCTAs.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const planName = btn.getAttribute('data-tier');
      const formInterestSelect = document.getElementById('form-interest');
      if (formInterestSelect) {
        formInterestSelect.value = planName + ' Plan';
        formInterestSelect.dispatchEvent(new Event('change'));
      }
    });
  });

  // ==========================================
  // 10. Portfolio Dynamic Deep Dive Modal
  // ==========================================
  const modal = document.getElementById('portfolio-detail-modal');
  const openModalBtns = document.querySelectorAll('.open-project-modal');
  const closeModalBtn = document.getElementById('close-portfolio-modal');
  const modalContentBox = document.getElementById('modal-project-content');

  const projectDetailsDB = {
    logistics: `
      <span class="modal-subtitle">Web Design & SEO Integration</span>
      <h3>The Logistics Hub</h3>
      <div class="modal-content-grid">
        <div class="modal-left">
          <p class="modal-text">
            For global logistics brands, visibility, scheduling speed, and clear regional messaging are critical conversions factors. The Logistics Hub requested a complete visual redesign to merge regional delivery maps, real-time rates check widgets, and automated quote generation.
          </p>
          <p class="modal-text">
            <strong>Key Interventions:</strong> We integrated an optimized static Next.js engine mapping 40 key landing pages, minified all geographical raster files into lightweight, responsive Vector assets, and developed automated quote distribution logic that integrates directly with regional customer support nodes.
          </p>
          <p class="modal-text" style="color: var(--color-teal); font-weight: 600;">
            🔥 Outcome: Speed index went from 5.4s to 0.8s. Inbound qualified freight quote requests rose by 240% inside 90 days.
          </p>
        </div>
        <div class="modal-right">
          <div class="meta-item">
            <h5>CLIENT LOCATION</h5>
            <p>Chennai, India / Remote Global</p>
          </div>
          <div class="meta-item">
            <h5>TECH STACK</h5>
            <p>Next.js, Custom CSS Grid, Vercel Nodes, Google Search Mapping</p>
          </div>
          <div class="meta-item">
            <h5>SERVICE DELIVERED</h5>
            <p>Full SEO Audit, UI Rebranding, Automated Lead Pipelines</p>
          </div>
        </div>
      </div>
    `,
    mership: `
      <span class="modal-subtitle">Custom Web App & Routing Platform</span>
      <h3>Mercury Shipping & Logistics Services</h3>
      <div class="modal-content-grid">
        <div class="modal-left">
          <p class="modal-text">
            Mercury Shipping is a premium shipping and freight tracking system designed to streamline ship coordinates matching and cargo inventory. The client faced massive SMTP failures from legacy mail protocols on Vercel nodes.
          </p>
          <p class="modal-text">
            <strong>Key Interventions:</strong> We migrated the entire notification database to a Resend SDK architecture in Next.js, created automated custom email styling banners, resolved local DNS record metadata errors, and built a sleek dark dashboard using CSS grids showing ship positions.
          </p>
          <p class="modal-text" style="color: var(--color-green); font-weight: 600;">
            🔥 Outcome: Email delivery reached 100%. User dashboard load lag cut by 70%, scoring a perfect 98/100 performance score.
          </p>
        </div>
        <div class="modal-right">
          <div class="meta-item">
            <h5>CLIENT LOCATION</h5>
            <p>No. 269/1 JSJ Complex, B1, 2nd Fl, Thambu Chetty St, Chennai 600 001</p>
          </div>
          <div class="meta-item">
            <h5>TECH STACK</h5>
            <p>React, Tailwind Framework, Resend SDK, Vercel Node API, Local Storage</p>
          </div>
          <div class="meta-item">
            <h5>SERVICE DELIVERED</h5>
            <p>Email Migration, Routing Dashboard, Sub-Second Latency Tunings</p>
          </div>
        </div>
      </div>
    `,
    dental: `
      <span class="modal-subtitle">SaaS Scheduling Platform & Local SEO</span>
      <h3>Chennai Dental Portal</h3>
      <div class="modal-content-grid">
        <div class="modal-left">
          <p class="modal-text">
            Chennai Dental Group is one of Muthialpet's most popular healthcare networks. Booking delays and bad mobile scheduling calendars caused client drops, especially on standard local network constraints.
          </p>
          <p class="modal-text">
            <strong>Key Interventions:</strong> We built a highly static, progressive single page React scheduler that works offline and stores appointments in IndexedDB, optimized image sizes, and implemented structured local JSON-LD schemas.
          </p>
          <p class="modal-text" style="color: var(--color-pink); font-weight: 600;">
            🔥 Outcome: Google Pagespeed mobile core score hit a full 100/100. Local monthly doctor bookings expanded by 185%.
          </p>
        </div>
        <div class="modal-right">
          <div class="meta-item">
            <h5>CLIENT LOCATION</h5>
            <p>Muthialpet, George Town, Chennai</p>
          </div>
          <div class="meta-item">
            <h5>TECH STACK</h5>
            <p>HTML5 Semantics, React Engine, Local IndexedDB, Schema.org Structures</p>
          </div>
          <div class="meta-item">
            <h5>SERVICE DELIVERED</h5>
            <p>Offline Scheduler App, Local Search Engine Domination</p>
          </div>
        </div>
      </div>
    `
  };

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const prName = btn.getAttribute('data-project');
      
      if (modal && modalContentBox && projectDetailsDB[prName]) {
        modalContentBox.innerHTML = projectDetailsDB[prName];
        modal.classList.add('open');
        document.body.classList.add('no-scroll');
      }
    });
  });

  if (closeModalBtn && modal) {
    function closeModal() {
      modal.classList.remove('open');
      document.body.classList.remove('no-scroll');
    }

    closeModalBtn.addEventListener('click', closeModal);

    // Close on outer container clicks
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC Key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  // ==========================================
  // 11. Interactive Contact Form (AJAX Simulation)
  // ==========================================
  const proposalForm = document.getElementById('proposal-form');
  const successOverlay = document.getElementById('form-success-overlay');
  const closeSuccessBtn = document.getElementById('close-success-btn');
  const submitBtn = document.getElementById('form-submit-btn');

  if (proposalForm && successOverlay) {
    proposalForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Collect actual form values
      const name = document.getElementById('form-name').value;
      const email = document.getElementById('form-email').value;
      const company = document.getElementById('form-company').value || 'Acme Corp';
      const interest = document.getElementById('form-interest').value;
      const details = document.getElementById('form-project-details').value;

      // Disable submission button, trigger premium loading feedback
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending details... <span class="spinner">⚙</span>';
      }

      // Simulate AJAX Server Communication Delay (1.5 seconds)
      setTimeout(() => {
        // Save in LocalStorage (for local state persistence proof)
        const leadObject = { name, email, company, interest, details, date: new Date().toISOString() };
        localStorage.setItem('troyflex_lead', JSON.stringify(leadObject));

        // Populate Success Splash content
        document.getElementById('success-user-name').innerText = name;
        document.getElementById('success-interest').innerText = interest;

        // Show Success card
        successOverlay.classList.add('active');
        
        // Reset Form elements
        proposalForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Send message <span class="btn-arrow">→</span>';
        }
      }, 1500);
    });

    if (closeSuccessBtn) {
      closeSuccessBtn.addEventListener('click', () => {
        successOverlay.classList.remove('active');
      });
    }
  }

  // ==========================================
  // 12. Vercel / Linear Glowing Borders Hover Trick
  // ==========================================
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Set custom CSS custom variables relative to cursor
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

});
