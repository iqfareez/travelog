export function mountImageLightbox() {
  const dialog = document.getElementById('lightbox');
  if (!(dialog instanceof HTMLDialogElement) || dialog.dataset.lightboxReady === 'true') return;
  dialog.dataset.lightboxReady = 'true';

  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCap = document.getElementById('lightbox-caption');
  const closeBtn = dialog.querySelector('.lightbox-close');
  const navigation = dialog.querySelector('.lightbox-navigation');
  const previousBtn = dialog.querySelector('.lightbox-previous');
  const nextBtn = dialog.querySelector('.lightbox-next');
  const position = dialog.querySelector('.lightbox-position');

  if (
    !(lightboxImg instanceof HTMLImageElement) ||
    !(lightboxCap instanceof HTMLParagraphElement) ||
    !(closeBtn instanceof HTMLButtonElement) ||
    !(navigation instanceof HTMLElement) ||
    !(previousBtn instanceof HTMLButtonElement) ||
    !(nextBtn instanceof HTMLButtonElement) ||
    !(position instanceof HTMLElement)
  ) {
    return;
  }

  let previousFocus: Element | null = null;
  let group: HTMLImageElement[] = [];
  let activeIndex = 0;

  const restorePage = () => {
    document.body.style.overflow = '';
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    previousFocus = null;
    group = [];
  };

  const closeLightbox = () => {
    if (dialog.open) dialog.close();
  };

  const showImage = () => {
    const img = group[activeIndex];
    if (!img) return;
    const caption =
      img.nextElementSibling?.tagName === 'EM'
        ? (img.nextElementSibling.textContent ?? '')
        : (img.closest('figure.image-group')?.querySelector(':scope > figcaption')?.textContent ??
          '');
    lightboxImg.src = img.getAttribute('data-src') || img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
    lightboxCap.textContent = caption;
    lightboxCap.hidden = !caption;
    navigation.hidden = group.length < 2;
    position.textContent = `${activeIndex + 1} / ${group.length}`;
  };

  const navigate = (direction: number) => {
    if (group.length < 2) return;
    activeIndex = (activeIndex + direction + group.length) % group.length;
    showImage();
  };

  const openLightbox = (img: HTMLImageElement) => {
    previousFocus = document.activeElement;
    const container = img.closest('.img-grid, figure.image-group');
    group = container
      ? Array.from(container.querySelectorAll<HTMLImageElement>('img')).filter(
          (image) => !image.closest('a')
        )
      : [img];
    activeIndex = group.indexOf(img);
    showImage();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    closeBtn.focus({ preventScroll: true });
  };

  document.querySelectorAll<HTMLImageElement>('.prose img').forEach((img) => {
    if (img.closest('a') || img.dataset.lightboxBound === 'true') return;
    img.dataset.lightboxBound = 'true';
    img.classList.add('is-zoomable');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-haspopup', 'dialog');
    img.setAttribute('aria-label', `${img.alt || 'Image'} preview`);

    const open = () => openLightbox(img);

    img.addEventListener('click', open);
    img.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  previousBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeLightbox();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      navigate(event.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const controls = navigation.hidden ? [closeBtn] : [closeBtn, previousBtn, nextBtn];
    const index = controls.findIndex((button) => button === document.activeElement);
    const nextIndex = (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    controls[nextIndex].focus({ preventScroll: true });
  });
  dialog.addEventListener('close', restorePage);
}
