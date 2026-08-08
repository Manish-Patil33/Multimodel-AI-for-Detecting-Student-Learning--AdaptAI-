/**
 * EduAdapt AI - Interactive Dock Sidebar Extension
 * Provides macOS Framer-Motion style spring physics and magnification for EduAdapt sidebars.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDockSidebars();
});

function initDockSidebars() {
  const sidebars = document.querySelectorAll('.sidebar');
  if (!sidebars.length) return;

  sidebars.forEach((sidebar) => {
    const nav = sidebar.querySelector('nav');
    if (!nav) return;

    nav.classList.add('dock-nav-container');

    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      // Ensure icon element is wrapped in .dock-icon
      let iconSpan = link.querySelector('.nav-icon');
      if (iconSpan && !iconSpan.classList.contains('dock-icon')) {
        iconSpan.classList.add('dock-icon');
      }

      // Extract text for tooltip
      const text = Array.from(link.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join(' ');

      // Create DockLabel tooltip element if not already present
      if (!link.querySelector('.dock-label')) {
        const labelEl = document.createElement('div');
        labelEl.className = 'dock-label';
        labelEl.textContent = text || link.getAttribute('data-tooltip') || 'Menu';
        link.appendChild(labelEl);
      }
    });

    // Spring magnification physics parameters
    const MAX_MAGNIFICATION = 1.22; // max scale factor
    const ICON_MAGNIFICATION = 1.45; // icon scale factor
    const INFLUENCE_DISTANCE = 110; // influence radius in px

    let isHovered = false;

    nav.addEventListener('mouseenter', () => {
      isHovered = true;
    });

    nav.addEventListener('mousemove', (e) => {
      if (!isHovered) return;
      const mouseY = e.clientY;

      navLinks.forEach((link) => {
        const rect = link.getBoundingClientRect();
        const itemCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(mouseY - itemCenterY);

        if (distance < INFLUENCE_DISTANCE) {
          // Cosine / quadratic easing for organic spring magnification feel
          const factor = Math.cos((distance / INFLUENCE_DISTANCE) * (Math.PI / 2));
          const scale = 1 + factor * (MAX_MAGNIFICATION - 1);
          const iconScale = 1 + factor * (ICON_MAGNIFICATION - 1);
          const translateY = (mouseY < itemCenterY ? 1 : -1) * factor * 3;

          link.style.transform = `scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
          link.style.zIndex = '10';

          const icon = link.querySelector('.dock-icon');
          if (icon) {
            icon.style.transform = `scale(${iconScale.toFixed(3)})`;
          }
        } else {
          link.style.transform = 'scale(1) translateY(0px)';
          link.style.zIndex = '1';
          const icon = link.querySelector('.dock-icon');
          if (icon) icon.style.transform = 'scale(1)';
        }
      });
    });

    nav.addEventListener('mouseleave', () => {
      isHovered = false;
      navLinks.forEach((link) => {
        link.style.transform = 'scale(1) translateY(0px)';
        link.style.zIndex = '1';
        const icon = link.querySelector('.dock-icon');
        if (icon) icon.style.transform = 'scale(1)';
      });
    });
  });
}
