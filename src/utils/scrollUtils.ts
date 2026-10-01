/**
 * Universal Scroll & Viewport Alignment Utility
 *
 * Provides smooth, reliable viewport docking for interactive controls (dropdowns, search boxes, pickers)
 * ensuring they smoothly glide to the top of the visible screen or modal container when activated.
 *
 * This guarantees that:
 * 1. Dropdown option lists have maximum downward vertical clearance and are fully visible.
 * 2. Mobile soft keyboards never obscure active search inputs or filter results.
 * 3. Modals and popup dialogs automatically scroll their inner bodies so dropdowns and search bars are pinned at the top.
 */

export interface ScrollToTopOptions {
  /** Top offset padding in pixels (defaults to accounting for sticky navbar or modal headers) */
  offset?: number;
  /** Scrolling behavior ('smooth' | 'auto', defaults to 'smooth') */
  behavior?: ScrollBehavior;
  /** Optional delay before initiating scroll in milliseconds */
  delay?: number;
}

/**
 * Traverses up the DOM tree to locate the nearest scrollable ancestor container (e.g. KalyaniModal body).
 */
export function getScrollableParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  let parent = node.parentElement;

  while (parent && parent !== document.body && parent !== document.documentElement) {
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
 * Checks whether an element is near the bottom of the viewport or its scroll container.
 * Useful for determining if dropdown menus should open upward instead of downward.
 */
export function shouldOpenUpwards(element: HTMLElement | null, requiredHeight = 240): boolean {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  return spaceBelow < requiredHeight && spaceAbove > spaceBelow;
}

/**
 * Smoothly scrolls an element towards the top of its visible context (either its scrollable modal body
 * or the main browser window below the sticky header).
 */
export function scrollToTopView(element: HTMLElement | null, options?: ScrollToTopOptions): void {
  if (!element) return;

  const performScroll = () => {
    if (!element || !element.isConnected) return;

    const scrollParent = getScrollableParent(element);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const defaultNavOffset = isMobile ? 68 : 82;
    const behavior = options?.behavior || 'smooth';

    // 1. Inside a scrollable container (e.g., inside a Modal body)
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      const elemRect = element.getBoundingClientRect();
      const currentScrollTop = scrollParent.scrollTop;
      const modalPadding = options?.offset ?? 14;

      const targetScrollTop = Math.max(0, currentScrollTop + (elemRect.top - parentRect.top) - modalPadding);

      scrollParent.scrollTo({
        top: targetScrollTop,
        behavior,
      });

      // Also ensure the modal container itself is visible in the window if pushed offscreen
      if (parentRect.top < defaultNavOffset || parentRect.bottom > window.innerHeight) {
        const windowTargetY = Math.max(
          0,
          (window.scrollY || window.pageYOffset || 0) + parentRect.top - defaultNavOffset
        );
        window.scrollTo({
          top: windowTargetY,
          behavior,
        });
      }
      return;
    }

    // 2. In normal document flow on the main page (Window scrolling)
    const elemRect = element.getBoundingClientRect();
    const offset = options?.offset ?? defaultNavOffset;
    const currentScrollY = window.scrollY || window.pageYOffset || 0;
    const targetY = Math.max(0, currentScrollY + elemRect.top - offset);

    window.scrollTo({
      top: targetY,
      behavior,
    });
  };

  const delay = options?.delay ?? 0;
  if (delay > 0) {
    setTimeout(performScroll, delay);
  } else {
    // Execute immediately
    performScroll();
    // Follow-up after short delay to handle mobile virtual keyboard appearance and CSS transitions
    setTimeout(performScroll, 120);
    setTimeout(performScroll, 280);
  }
}
