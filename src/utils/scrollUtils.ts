/**
 * Universal Scroll & Viewport Alignment Utility
 *
 * Provides intelligent, comfortable viewport alignment for interactive controls (dropdowns, search boxes, pickers)
 * ensuring they have ample vertical room for downward option lists without scrolling "too much top".
 */

export interface ScrollToTopOptions {
  /** Top offset padding in pixels (defaults to a comfortable upper position) */
  offset?: number;
  /** Scrolling behavior ('smooth' | 'auto', defaults to 'smooth') */
  behavior?: ScrollBehavior;
  /** Optional delay before initiating scroll in milliseconds */
  delay?: number;
  /** Force scrolling even if downward space exists (critical for input focus before soft keyboard opens) */
  force?: boolean;
}

/**
 * Checks if an element is contained within an active modal dialog.
 */
export function isInsideModal(element: HTMLElement | null): boolean {
  if (!element) return false;
  return Boolean(
    element.closest('[role="dialog"]') ||
    element.closest('.kalyani-modal-card') ||
    element.closest('[data-modal="true"]')
  );
}

/**
 * Traverses up the DOM tree to locate the nearest scrollable ancestor container (e.g. KalyaniModal body).
 * Confines search strictly within the modal if the element is inside a modal.
 */
export function getScrollableParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  const modalDialog = node.closest('[role="dialog"]') || node.closest('[data-modal="true"]');
  let parent = node.parentElement;

  while (parent && parent !== document.body && parent !== document.documentElement) {
    // If inside a modal dialog, NEVER look beyond the modal dialog boundary!
    if (modalDialog && !modalDialog.contains(parent)) {
      break;
    }

    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight + 4;

    if (isScrollable) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return null;
}

/**
 * Intelligently and gently scrolls an element towards a comfortable upper position on the screen
 * or inside its scrollable modal container ONLY if needed, ensuring the dropdown options
 * that open downwards have abundant vertical clearance.
 *
 * For input elements or when forced, it unconditionally glides the element into comfortable view
 * and accommodates virtual keyboard animation on mobile devices.
 */
export function scrollToTopView(element: HTMLElement | null, options?: ScrollToTopOptions): void {
  if (!element) return;

  const performScroll = () => {
    if (!element || !element.isConnected) return;

    const inModal = isInsideModal(element);
    const scrollParent = getScrollableParent(element);
    const behavior = options?.behavior || 'smooth';
    const isInput = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    const shouldForce = options?.force || isInput;

    // 1. Inside a scrollable container (e.g. Modal body or scrollable panel)
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      const elemRect = element.getBoundingClientRect();
      const spaceBelowInParent = parentRect.bottom - elemRect.bottom;
      const comfortableModalOffset = options?.offset ?? 16;

      // If not forced, and the element already has plenty of space below inside the scrollable container (>= 220px)
      // and isn't tucked under the header, no scroll is needed!
      if (!shouldForce && elemRect.top >= parentRect.top + comfortableModalOffset && spaceBelowInParent >= 220) {
        return;
      }

      // Gently scroll inside the container to align element at the comfortable upper position
      const currentScrollTop = scrollParent.scrollTop;
      const targetScrollTop = Math.max(
        0,
        currentScrollTop + (elemRect.top - parentRect.top) - comfortableModalOffset
      );

      scrollParent.scrollTo({
        top: targetScrollTop,
        behavior,
      });

      // For inputs or forced scrolls on mobile, adjust after keyboard slides into view
      if (shouldForce) {
        setTimeout(() => {
          if (!element || !element.isConnected || !scrollParent) return;
          const updatedParent = scrollParent.getBoundingClientRect();
          const updatedElem = element.getBoundingClientRect();
          const reTarget = Math.max(
            0,
            scrollParent.scrollTop + (updatedElem.top - updatedParent.top) - comfortableModalOffset
          );
          if (Math.abs(reTarget - scrollParent.scrollTop) > 4) {
            scrollParent.scrollTo({ top: reTarget, behavior: 'smooth' });
          }
        }, 180);

        setTimeout(() => {
          if (!element || !element.isConnected || !scrollParent) return;
          const updatedParent = scrollParent.getBoundingClientRect();
          const updatedElem = element.getBoundingClientRect();
          const reTarget = Math.max(
            0,
            scrollParent.scrollTop + (updatedElem.top - updatedParent.top) - comfortableModalOffset
          );
          if (Math.abs(reTarget - scrollParent.scrollTop) > 4) {
            scrollParent.scrollTo({ top: reTarget, behavior: 'smooth' });
          }
        }, 360);
      }
      return;
    }

    // 2. If element is inside a modal and the modal content fits without scrolling:
    // NEVER scroll the main window behind the modal!
    if (inModal) {
      return;
    }

    // 3. In normal document flow on the main page (Window scrolling)
    const elemRect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - elemRect.bottom;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    // Balanced, comfortable upper margin
    const comfortableTopMargin = options?.offset ?? (isMobile ? 110 : 145);

    // If not forced and already has enough space below for options (>= 280px)
    if (!shouldForce && elemRect.top >= comfortableTopMargin && spaceBelow >= 280) {
      return;
    }

    // Otherwise, gently scroll just enough to position it at the comfortable upper area
    const currentScrollY = window.scrollY || window.pageYOffset || 0;
    const targetY = Math.max(0, currentScrollY + elemRect.top - comfortableTopMargin);

    if (Math.abs(targetY - currentScrollY) > 10) {
      window.scrollTo({
        top: targetY,
        behavior,
      });
    }

    if (shouldForce && isMobile) {
      setTimeout(() => {
        if (!element || !element.isConnected) return;
        const reElem = element.getBoundingClientRect();
        const reTarget = Math.max(0, (window.scrollY || window.pageYOffset || 0) + reElem.top - comfortableTopMargin);
        window.scrollTo({ top: reTarget, behavior: 'smooth' });
      }, 250);
    }
  };

  const delay = options?.delay ?? 0;
  if (delay > 0) {
    setTimeout(performScroll, delay);
  } else {
    performScroll();
  }
}
