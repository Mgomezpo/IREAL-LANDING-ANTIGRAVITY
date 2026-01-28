// Notebook Scroll Logic

(function () {
    const CONFIG = {
        FRAME_COUNT: 246, // Cut at tunnel scene
        IMAGES_FOLDER: 'notebook-frames', // Relative to root
        MIN_SCROLL_DISTANCE: 1800,
        SCROLL_DISTANCE_MULTIPLIER: 4, // Faster scroll as requested (factor 4)
        HOLD_DISTANCE_MULTIPLIER: 2, // Increased hold for longer reading time
        CROP_SCALE: 1.1, // Minimal zoom for HD frames
        FINAL_FRAME_START: 0.9,
        FINAL_FRAME_SCALE: 1.1,
        IMG_EXTENSION: 'jpg'
    };

    const state = {
        images: [],
        isLoaded: false,
        isActive: true,
        scrollHeight: 0,
        navHidden: false,
        currentFrame: 1
    };

    // Elements
    let container, scrollSection, canvas, ctx, stickyWrapper, finalCanvas, finalCtx, loadingOverlay, contentSection, heroOverlay;

    function init() {
        container = document.querySelector('.notebook-scroll-container');
        if (!container) return; // Guard clause

        scrollSection = container.querySelector('.notebook-scroll-section');
        stickyWrapper = container.querySelector('.notebook-sticky-wrapper');
        heroOverlay = document.getElementById('hero-overlay');
        canvas = document.getElementById('notebook-canvas');
        ctx = canvas ? canvas.getContext('2d') : null;
        loadingOverlay = document.querySelector('.notebook-loading');

        // Setup Final Frame
        finalCanvas = document.getElementById('final-frame-canvas');
        finalCtx = finalCanvas ? finalCanvas.getContext('2d') : null;

        // Resize Handler
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial calculation

        // Scroll Handler
        window.addEventListener('scroll', handleScroll);

        // Load Images
        loadImages();
    }

    function getAnimationDistance() {
        return Math.max(CONFIG.MIN_SCROLL_DISTANCE, window.innerHeight * CONFIG.SCROLL_DISTANCE_MULTIPLIER);
    }

    function getTotalScrollDistance() {
        const animDist = getAnimationDistance();
        const holdDist = window.innerHeight * CONFIG.HOLD_DISTANCE_MULTIPLIER;
        return animDist + holdDist;
    }

    function handleResize() {
        state.scrollHeight = getTotalScrollDistance();
        if (scrollSection) {
            scrollSection.style.height = `${state.scrollHeight}px`;
        }

        // Re-render current frame on resize to match new dimensions
        if (state.isLoaded) {
            // Use requestAnimationFrame to avoid thrashing
            requestAnimationFrame(() => {
                renderFrame(state.currentFrame, canvas, ctx);
            });
        }
    }

    async function loadImages() {
        const promises = [];
        for (let i = 1; i <= CONFIG.FRAME_COUNT; i++) {
            const p = new Promise((resolve, reject) => {
                const img = new Image();
                // Add cache buster to ensure new HD images are loaded
                img.src = `${CONFIG.IMAGES_FOLDER}/frame_${i}.${CONFIG.IMG_EXTENSION}`;
                img.onload = () => {
                    state.images[i] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load frame ${i}`);
                    resolve();
                };
            });
            promises.push(p);
        }

        try {
            await Promise.all(promises);
            state.isLoaded = true;
            if (loadingOverlay) loadingOverlay.style.opacity = '0';

            // Initial render
            requestAnimationFrame(() => {
                renderFrame(1, canvas, ctx);
                setTimeout(() => { if (loadingOverlay) loadingOverlay.style.display = 'none'; }, 500);
            });

        } catch (e) {
            console.error("Error loading notebook frames", e);
        }
    }

    function handleScroll() {
        if (!state.isLoaded || !container) return;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const elementOffset = container.offsetTop;

        // Calculations in Pixels
        const scrolled = scrollTop - elementOffset;
        const animationDist = getAnimationDistance();
        const totalDist = getTotalScrollDistance();

        // 1. Animation Progress (0 to 1 over the animation distance)
        let animProgress = scrolled / animationDist;
        animProgress = Math.max(0, Math.min(1, animProgress));

        // Constants used for frame logic
        const rawIndex = 1 + animProgress * (CONFIG.FRAME_COUNT - 1);
        state.currentFrame = Math.max(1, Math.min(CONFIG.FRAME_COUNT, rawIndex));

        // Render
        requestAnimationFrame(() => renderFrame(state.currentFrame, canvas, ctx));

        // 3. OVERLAY TRANSITION LOGIC
        // Immediate appearance when animation finishes
        if (heroOverlay) {
            // Check if we are at or past the end of the animation
            if (scrolled >= animationDist - 5) { // Small buffer to ensure it triggers
                heroOverlay.style.opacity = '1';
                heroOverlay.style.pointerEvents = 'auto';

                // Static "pop" state, no transition during scroll
                heroOverlay.querySelector('.hero-text-wrapper').style.transform = `scale(1)`;
            } else {
                // During animation
                heroOverlay.style.opacity = '0';
                heroOverlay.style.pointerEvents = 'none';
                heroOverlay.querySelector('.hero-text-wrapper').style.transform = `scale(0.9)`;
            }
        }

        // 2. Positioning Logic (Pinned or Absolute)
        // We unpin only when we exceeded TOTAL distance (animation + hold)
        // Actually, we need to compare `scrolled` against the total scrollable area minus viewport
        // But since we set height explicitly, relative to viewport...
        // Let's stick to the logic: if we scrolled past the total allocated height, unpin.

        // The container height is `totalDist`.
        // However, 'scrollSection' is inside.
        // The user sees the section end when (scrollTop + viewportHeight) > (elementOffset + totalDist)? 
        // No, standard sticky logic:
        // We stay fixed while scrolled < (totalDist - viewportHeight).
        // Wait, simpler:

        const pinLimit = totalDist - window.innerHeight; // When bottom of section hits bottom of viewport

        if (stickyWrapper) {
            stickyWrapper.style.width = '100vw';
            stickyWrapper.style.height = '100vh';

            if (scrolled >= pinLimit) {
                // AT END
                state.isActive = false;
                stickyWrapper.style.position = 'absolute';
                stickyWrapper.style.top = 'auto'; // Clear top
                stickyWrapper.style.bottom = '0';
                stickyWrapper.style.left = '0';
            } else if (scrolled < 0) {
                // BEFORE START
                state.isActive = false;
                stickyWrapper.style.position = 'absolute';
                stickyWrapper.style.top = '0';
                stickyWrapper.style.bottom = 'auto';
                stickyWrapper.style.left = '0';
            } else {
                // DURING (Including Hold Phase)
                state.isActive = true;
                stickyWrapper.style.position = 'fixed';
                stickyWrapper.style.top = '0';
                stickyWrapper.style.bottom = 'auto';
                stickyWrapper.style.left = '0';
            }
            stickyWrapper.style.opacity = '1';
            stickyWrapper.style.visibility = 'visible';
        }

        // Nav Visibility Logic (Optional)
        // Hide nav during animation, show nav appearing during hold? Or hide all the way?
        // User asked for "closure". Maybe show nav appearing during hold?
        // Let's keep hiding it during the *Movement* part.
        const shouldHideNav = animProgress > 0.05 && animProgress < 0.95;
        if (state.navHidden !== shouldHideNav) {
            state.navHidden = shouldHideNav;
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (shouldHideNav) navbar.classList.add('nav-hidden');
                else navbar.classList.remove('nav-hidden');
            }
        }
    }

    function renderFrame(index, targetCanvas, targetCtx) {
        if (!targetCanvas || !targetCtx || !state.isLoaded) return;

        const clampedIndex = Math.floor(index); // Floor since we array access
        const img = state.images[clampedIndex];
        if (!img) return;

        const progress = clampedIndex / CONFIG.FRAME_COUNT;

        // Zoom Logic
        // React: 
        // const zoomOutT = Math.min(1, Math.max(0, (progress - FINAL_FRAME_START) / (1 - FINAL_FRAME_START)));
        // const scaleFactor = CROP_SCALE - (CROP_SCALE - FINAL_FRAME_SCALE) * zoomOutT;

        const zoomStart = CONFIG.FINAL_FRAME_START;
        const zoomOutT = Math.min(1, Math.max(0, (progress - zoomStart) / (1 - zoomStart)));
        const scaleFactor = CONFIG.CROP_SCALE - (CONFIG.CROP_SCALE - CONFIG.FINAL_FRAME_SCALE) * zoomOutT;

        // Canvas Setup
        const rect = targetCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Use window dimensions for full screen canvas to ensure coverage
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const displayWidth = Math.round(viewportWidth * dpr);
        const displayHeight = Math.round(viewportHeight * dpr);

        if (targetCanvas.width !== displayWidth || targetCanvas.height !== displayHeight) {
            targetCanvas.width = displayWidth;
            targetCanvas.height = displayHeight;
        }

        // Draw
        targetCtx.imageSmoothingEnabled = true;
        targetCtx.imageSmoothingQuality = 'high';

        targetCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        targetCtx.clearRect(0, 0, viewportWidth, viewportHeight); // Clear since we cover safely now

        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        const hRatio = viewportWidth / imgWidth;
        const vRatio = viewportHeight / imgHeight;

        // COVER LOGIC (Fill Screen)
        // With 1920x1080 source, this will look great on 1080p screens.
        // It will stretch only if screen > 1920x1080.
        const scale = Math.max(hRatio, vRatio);

        const offsetX = (viewportWidth - imgWidth * scale) / 2;
        const offsetY = (viewportHeight - imgHeight * scale) / 2;

        targetCtx.drawImage(
            img,
            0, 0, imgWidth, imgHeight,
            offsetX, offsetY,
            imgWidth * scale, imgHeight * scale
        );
    }

    // Run Init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
