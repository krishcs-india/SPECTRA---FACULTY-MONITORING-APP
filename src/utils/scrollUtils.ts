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
 * It avoids scrolling "too much top" (leaving a comfortable margin of 120-150px on screen,
 * or 24-32px inside modals) and avoids scrolling altogether if the element already has ample
 * downward space.
 */
export function scrollToTopView(element: HTMLElement | null, options?: ScrollToTopOptions): void {
  if (!element) return;

  const performScroll = () => {
    if (!element || !element.isConnected) return;

    const inModal = isInsideModal(element);
    const scrollParent = getScrollableParent(element);
    const behavior = options?.behavior || 'smooth';

    // 1. Inside a scrollable container (e.g. Modal body or scrollable panel)
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      const elemRect = element.getBoundingClientRect();
      const spaceBelowInParent = parentRect.bottom - elemRect.bottom;
      const comfortableModalOffset = options?.offset ?? 24;

      // If the element already has plenty of space below inside the scrollable container (>= 220px)
      // and isn't tucked under the header, no scroll is needed!
      if (elemRect.top >= parentRect.top + comfortableModalOffset && spaceBelowInParent >= 220) {
        return;
      }

      // Gently scroll inside the container to give comfortable downward room
      const currentScrollTop = scrollParent.scrollTop;
      const targetScrollTop = Math.max(
        0,
        currentScrollTop + (elemRect.top - parentRect.top) - comfortableModalOffset
      );

      // Only scroll if difference is meaningful
      if (Math.abs(targetScrollTop - currentScrollTop) > 10) {
        scrollParent.scrollTo({
          top: targetScrollTop,
          behavior,
        });
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
    
    // Balanced, comfortable upper margin: NOT slammed against the navbar (70px),
    // but resting naturally around 120px-150px down the viewport.
    const comfortableTopMargin = options?.offset ?? (isMobile ? 110 : 145);

    // If the element already has enough space below for options (>= 280px)
    // and is well below the top header, do not scroll!
    if (elemRect.top >= comfortableTopMargin && spaceBelow >= 280) {
      return;
    }

    // Otherwise, gently scroll just enough to position it at the comfortable upper area
    const currentScrollY = window.scrollY || window.pageYOffset || 0;
    const targetY = Math.max(0, currentScrollY + elemRect.top - comfortableTopMargin);

    // Only scroll if there's a meaningful difference (avoid micro-jitter)
    if (Math.abs(targetY - currentScrollY) > 15) {
      window.scrollTo({
        top: targetY,
        behavior,
      });
    }
  };

  const delay = options?.delay ?? 0;
  if (delay > 0) {
    setTimeout(performScroll, delay);
  } else {
    performScroll();
  }
}
