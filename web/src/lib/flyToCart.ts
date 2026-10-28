/**
 * Imzo animatsiyasi: taom rasmi kichrayib pastki menyudagi savat ikonkasiga "uchadi",
 * so'ng savat silkinadi. Savat ikonkasi `data-cart-target` atributi bilan belgilangan.
 */
export const CART_BUMP_EVENT = 'cart:bump';

export function flyToCart(source: Element | null, imageUrl: string) {
  const bump = () => window.dispatchEvent(new Event(CART_BUMP_EVENT));
  const target = document.querySelector('[data-cart-target]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!source || !target || reduced || !imageUrl) {
    bump();
    return;
  }

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = Math.min(from.width, from.height, 120);

  const ghost = document.createElement('img');
  ghost.src = imageUrl;
  ghost.alt = '';
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    borderRadius: '50%',
    zIndex: '80',
    pointerEvents: 'none',
    boxShadow: '0 10px 24px -8px rgb(28 20 16 / 0.45)',
  });
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  const animation = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.15 - 60}px) scale(0.75)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.18)`, opacity: 0.6 },
    ],
    { duration: 650, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
  );

  animation.onfinish = () => {
    ghost.remove();
    bump();
  };
}
