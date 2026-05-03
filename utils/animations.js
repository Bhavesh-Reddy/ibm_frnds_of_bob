/**
 * Animation Utilities using GSAP
 * Professional animations for Obfusi-Bob dashboard
 */

// Initialize GSAP (assumes GSAP is loaded via CDN in HTML)
const gsap = window.gsap;

/**
 * Page transition animations
 */
export const pageTransitions = {
    /**
     * Fade in page content
     */
    fadeIn(element, duration = 0.6) {
        return gsap.from(element, {
            opacity: 0,
            y: 20,
            duration,
            ease: 'power2.out'
        });
    },

    /**
     * Fade out page content
     */
    fadeOut(element, duration = 0.4) {
        return gsap.to(element, {
            opacity: 0,
            y: -20,
            duration,
            ease: 'power2.in'
        });
    },

    /**
     * Slide in from right
     */
    slideInRight(element, duration = 0.5) {
        return gsap.from(element, {
            x: 100,
            opacity: 0,
            duration,
            ease: 'power3.out'
        });
    },

    /**
     * Slide in from left
     */
    slideInLeft(element, duration = 0.5) {
        return gsap.from(element, {
            x: -100,
            opacity: 0,
            duration,
            ease: 'power3.out'
        });
    },

    /**
     * Scale in animation
     */
    scaleIn(element, duration = 0.4) {
        return gsap.from(element, {
            scale: 0.9,
            opacity: 0,
            duration,
            ease: 'back.out(1.7)'
        });
    }
};

/**
 * Card animations
 */
export const cardAnimations = {
    /**
     * Stagger animation for multiple cards
     */
    staggerIn(elements, delay = 0.1) {
        return gsap.from(elements, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: delay,
            ease: 'power2.out'
        });
    },

    /**
     * Hover effect for cards
     */
    setupHover(element) {
        element.addEventListener('mouseenter', () => {
            gsap.to(element, {
                y: -8,
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        element.addEventListener('mouseleave', () => {
            gsap.to(element, {
                y: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    },

    /**
     * Click ripple effect
     */
    ripple(element, event) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255,255,255,0.5);
            transform: translate(-50%, -50%);
            pointer-events: none;
        `;
        element.appendChild(ripple);

        gsap.to(ripple, {
            width: 300,
            height: 300,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => ripple.remove()
        });
    }
};

/**
 * Loading animations
 */
export const loadingAnimations = {
    /**
     * Spinner animation
     */
    spinner(element) {
        return gsap.to(element, {
            rotation: 360,
            duration: 1,
            repeat: -1,
            ease: 'linear'
        });
    },

    /**
     * Pulse animation
     */
    pulse(element) {
        return gsap.to(element, {
            scale: 1.1,
            opacity: 0.7,
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut'
        });
    },

    /**
     * Progress bar animation
     */
    progressBar(element, progress) {
        return gsap.to(element, {
            width: `${progress}%`,
            duration: 0.5,
            ease: 'power2.out'
        });
    },

    /**
     * Skeleton loading animation
     */
    skeleton(element) {
        return gsap.to(element, {
            backgroundPosition: '200% 0',
            duration: 1.5,
            repeat: -1,
            ease: 'linear'
        });
    }
};

/**
 * Data visualization animations
 */
export const dataAnimations = {
    /**
     * Count up animation
     */
    countUp(element, endValue, duration = 1) {
        const obj = { value: 0 };
        return gsap.to(obj, {
            value: endValue,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
                element.textContent = Math.round(obj.value);
            }
        });
    },

    /**
     * Progress circle animation
     */
    progressCircle(element, progress, duration = 1) {
        const circumference = 2 * Math.PI * 45; // radius = 45
        const offset = circumference - (progress / 100) * circumference;
        
        return gsap.to(element, {
            strokeDashoffset: offset,
            duration,
            ease: 'power2.out'
        });
    },

    /**
     * Bar chart animation
     */
    barChart(bars, duration = 0.8) {
        return gsap.from(bars, {
            scaleY: 0,
            transformOrigin: 'bottom',
            duration,
            stagger: 0.1,
            ease: 'power3.out'
        });
    },

    /**
     * Line chart draw animation
     */
    lineChart(path, duration = 1.5) {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        
        return gsap.to(path, {
            strokeDashoffset: 0,
            duration,
            ease: 'power2.inOut'
        });
    }
};

/**
 * Modal animations
 */
export const modalAnimations = {
    /**
     * Show modal with backdrop
     */
    show(modal, backdrop) {
        const tl = gsap.timeline();
        
        tl.set([modal, backdrop], { display: 'flex' })
          .to(backdrop, {
              opacity: 1,
              duration: 0.3,
              ease: 'power2.out'
          })
          .from(modal, {
              scale: 0.9,
              opacity: 0,
              duration: 0.4,
              ease: 'back.out(1.7)'
          }, '-=0.2');
        
        return tl;
    },

    /**
     * Hide modal with backdrop
     */
    hide(modal, backdrop) {
        const tl = gsap.timeline();
        
        tl.to(modal, {
              scale: 0.9,
              opacity: 0,
              duration: 0.3,
              ease: 'power2.in'
          })
          .to(backdrop, {
              opacity: 0,
              duration: 0.2,
              ease: 'power2.in'
          }, '-=0.1')
          .set([modal, backdrop], { display: 'none' });
        
        return tl;
    }
};

/**
 * Notification animations
 */
export const notificationAnimations = {
    /**
     * Slide in notification
     */
    slideIn(element, from = 'right') {
        const xValue = from === 'right' ? 100 : -100;
        
        return gsap.from(element, {
            x: xValue,
            opacity: 0,
            duration: 0.5,
            ease: 'power3.out'
        });
    },

    /**
     * Slide out notification
     */
    slideOut(element, to = 'right') {
        const xValue = to === 'right' ? 100 : -100;
        
        return gsap.to(element, {
            x: xValue,
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in'
        });
    },

    /**
     * Shake animation for errors
     */
    shake(element) {
        return gsap.to(element, {
            x: [-10, 10, -10, 10, 0],
            duration: 0.5,
            ease: 'power2.inOut'
        });
    }
};

/**
 * Button animations
 */
export const buttonAnimations = {
    /**
     * Click animation
     */
    click(element) {
        const tl = gsap.timeline();
        
        tl.to(element, {
              scale: 0.95,
              duration: 0.1,
              ease: 'power2.in'
          })
          .to(element, {
              scale: 1,
              duration: 0.2,
              ease: 'elastic.out(1, 0.3)'
          });
        
        return tl;
    },

    /**
     * Loading state animation
     */
    loading(element) {
        const spinner = element.querySelector('.spinner');
        if (spinner) {
            return gsap.to(spinner, {
                rotation: 360,
                duration: 1,
                repeat: -1,
                ease: 'linear'
            });
        }
    },

    /**
     * Success animation
     */
    success(element) {
        const tl = gsap.timeline();
        
        tl.to(element, {
              scale: 1.1,
              duration: 0.2,
              ease: 'power2.out'
          })
          .to(element, {
              scale: 1,
              duration: 0.3,
              ease: 'elastic.out(1, 0.3)'
          });
        
        return tl;
    }
};

/**
 * Scroll animations
 */
export const scrollAnimations = {
    /**
     * Fade in on scroll
     */
    fadeInOnScroll(elements) {
        gsap.from(elements, {
            scrollTrigger: {
                trigger: elements,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out'
        });
    },

    /**
     * Parallax effect
     */
    parallax(element, speed = 0.5) {
        gsap.to(element, {
            scrollTrigger: {
                trigger: element,
                scrub: true
            },
            y: (i, target) => -target.offsetHeight * speed,
            ease: 'none'
        });
    },

    /**
     * Reveal on scroll
     */
    reveal(element) {
        gsap.from(element, {
            scrollTrigger: {
                trigger: element,
                start: 'top 80%',
                end: 'top 20%',
                scrub: 1
            },
            opacity: 0,
            y: 100,
            ease: 'power2.out'
        });
    }
};

/**
 * Initialize all animations on page load
 */
export function initializeAnimations() {
    // Animate page content on load
    const mainContent = document.querySelector('main');
    if (mainContent) {
        pageTransitions.fadeIn(mainContent);
    }

    // Setup card hover effects
    const cards = document.querySelectorAll('.card, .stat-card, .analysis-card');
    cards.forEach(card => {
        cardAnimations.setupHover(card);
    });

    // Stagger animate cards
    if (cards.length > 0) {
        cardAnimations.staggerIn(cards);
    }

    // Animate stats counters
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => {
        const value = parseInt(stat.textContent) || 0;
        dataAnimations.countUp(stat, value);
    });

    // Setup scroll animations
    const scrollElements = document.querySelectorAll('[data-scroll-animate]');
    if (scrollElements.length > 0) {
        scrollAnimations.fadeInOnScroll(scrollElements);
    }

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (button.style.position !== 'relative') {
                button.style.position = 'relative';
                button.style.overflow = 'hidden';
            }
            cardAnimations.ripple(button, e);
        });
    });
}

/**
 * Cleanup animations
 */
export function cleanupAnimations() {
    gsap.killTweensOf('*');
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnimations);
} else {
    initializeAnimations();
}

// Made with Bob
