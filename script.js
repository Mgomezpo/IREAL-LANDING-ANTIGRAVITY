document.addEventListener('DOMContentLoaded', () => {

    // --- INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe Sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Observe Items (Why Items, Benefits, Generic Reveal)
    const animatedItems = document.querySelectorAll('.why-item, .benefit-card, .reveal-on-scroll');
    animatedItems.forEach(item => {
        observer.observe(item);
    });


    // --- SCROLL DRIVEN STORYTELLING (STICKY SECTION) ---
    const track = document.getElementById('reality-story');
    const sceneThoughts = document.getElementById('scene-thoughts');
    const sceneAgitation = document.getElementById('scene-agitation');
    const sceneSolution = document.getElementById('scene-solution');

    // Thoughts Items
    const thoughts = [
        document.querySelector('.p1'),
        document.querySelector('.p2'),
        document.querySelector('.p3'),
        document.querySelector('.p4')
    ];

    function handleScroll() {
        if (!track) return;

        const trackRect = track.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const trackHeight = trackRect.height;
        const scrollDist = trackHeight - viewportHeight;

        // Progress 0 to 1
        let progress = -trackRect.top / scrollDist;
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;

        // SCENE LOGIC
        // 1. Thoughts (0.0 - 0.45)
        if (progress < 0.45) {
            sceneThoughts.classList.add('active');
            sceneAgitation.classList.remove('active');
            sceneSolution.classList.remove('active');

            // Sequential reveals
            if (thoughts[0]) thoughts[0].classList.toggle('visible', progress > 0.05);
            if (thoughts[1]) thoughts[1].classList.toggle('visible', progress > 0.12);
            if (thoughts[2]) thoughts[2].classList.toggle('visible', progress > 0.19);
            if (thoughts[3]) thoughts[3].classList.toggle('visible', progress > 0.26);

        }
        // 2. Agitation (0.45 - 0.75)
        else if (progress >= 0.45 && progress < 0.75) {
            sceneThoughts.classList.remove('active');
            sceneAgitation.classList.add('active');
            sceneSolution.classList.remove('active');
        }
        // 3. Solution (0.75 - 1.0)
        else {
            sceneThoughts.classList.remove('active');
            sceneAgitation.classList.remove('active');
            sceneSolution.classList.add('active');
        }
    }

    // --- REVERSIBLE SCROLL OBSERVER (LINKED ANIMATIONS) ---
    // This replaces the manual scroll-math to ensure reliability.
    // Elements animate in when they enter, and out when they exit.
    const scrubObserverOptions = {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: "0px"
    };

    const scrubObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Remove class when it leaves the viewport (scrolling up or down completely past)
                // This gives the "linked" feeling as requested
                entry.target.classList.remove('visible');
            }
        });
    }, scrubObserverOptions);

    const scrubItems = document.querySelectorAll('.scroll-scrub');
    scrubItems.forEach(item => {
        scrubObserver.observe(item);
    });

    // Init Scroll Listener (Only for Reality Story now)
    if (track) {
        window.addEventListener('scroll', () => {
            window.requestAnimationFrame(() => {
                handleScroll();
            });
        });
        handleScroll(); // Initial check
    }

    // --- PRICING BILLING TOGGLE (Mensual / Anual) ---
    const billingToggle = document.querySelector('.pricing .billing-toggle');
    const pricingGrid = document.querySelector('.pricing .pricing-grid');

    if (billingToggle && pricingGrid) {
        const opts = billingToggle.querySelectorAll('.bt-opt');
        const priceEls = pricingGrid.querySelectorAll('.pricing-card .price');
        const forEls = pricingGrid.querySelectorAll('.pricing-card .for');
        const ctas = pricingGrid.querySelectorAll('a[data-cta-base]');

        const applyInterval = (interval) => {
            pricingGrid.setAttribute('data-billing', interval);

            opts.forEach(o => {
                const active = o.dataset.interval === interval;
                o.classList.toggle('is-active', active);
                o.setAttribute('aria-pressed', active ? 'true' : 'false');
            });

            priceEls.forEach(priceEl => {
                const amount = priceEl.dataset['price' + (interval === 'annual' ? 'Annual' : 'Monthly')];
                const suffix = priceEl.dataset['suffix' + (interval === 'annual' ? 'Annual' : 'Monthly')];
                if (amount) {
                    const span = document.createElement('span');
                    span.textContent = suffix || '';
                    priceEl.textContent = amount;
                    priceEl.appendChild(span);
                }
                const note = priceEl.dataset['note' + (interval === 'annual' ? 'Annual' : 'Monthly')];
                let noteEl = priceEl.parentElement.querySelector('.price-note');
                if (note) {
                    if (!noteEl) {
                        noteEl = document.createElement('span');
                        noteEl.className = 'price-note';
                        priceEl.insertAdjacentElement('afterend', noteEl);
                    }
                    noteEl.textContent = note;
                } else if (noteEl) {
                    noteEl.textContent = '';
                }
            });

            ctas.forEach(a => {
                const base = a.dataset.ctaBase;
                if (base) a.setAttribute('href', base + '&interval=' + interval);
            });

            try { sessionStorage.setItem('ireal_billing', interval); } catch (_) {}
        };

        opts.forEach(o => {
            o.addEventListener('click', () => applyInterval(o.dataset.interval));
        });

        let initial = 'monthly';
        try {
            const saved = sessionStorage.getItem('ireal_billing');
            if (saved === 'annual' || saved === 'monthly') initial = saved;
        } catch (_) {}
        applyInterval(initial);
    }
});
