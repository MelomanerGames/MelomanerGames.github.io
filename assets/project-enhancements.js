(() => {
    const content = document.querySelector('main.content');
    if (!content) return;

    const isEnglish = document.documentElement.lang.toLowerCase().startsWith('en');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactLayout = window.matchMedia('(max-width: 780px), (pointer: coarse)').matches;

    document.body.classList.add('project-page');

    const progress = document.createElement('div');
    progress.className = 'case-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.prepend(progress);

    const heading = content.querySelector(':scope > h1');
    if (heading) {
        const kicker = document.createElement('p');
        kicker.className = 'case-kicker';
        kicker.textContent = isEnglish ? 'Game project · Case study' : 'Игровой проект · Кейс';
        heading.before(kicker);

        const firstParagraph = heading.nextElementSibling?.matches('p') ? heading.nextElementSibling : null;
        const firstList = firstParagraph?.nextElementSibling?.matches('ul') ? firstParagraph.nextElementSibling : null;

        if (firstParagraph || firstList) {
            const overview = document.createElement('section');
            overview.className = 'project-overview';
            overview.setAttribute('aria-label', isEnglish ? 'Project overview' : 'Обзор проекта');
            heading.after(overview);

            if (firstParagraph) {
                firstParagraph.classList.add('project-summary');
                overview.appendChild(firstParagraph);
            }
            if (firstList) {
                firstList.classList.add('project-facts');
                overview.appendChild(firstList);
            }
        }
    }

    const sectionHeadings = Array.from(content.querySelectorAll(':scope > h2'));
    sectionHeadings.forEach((sectionHeading) => {
        const section = document.createElement('section');
        section.className = 'project-section';
        sectionHeading.before(section);
        section.appendChild(sectionHeading);

        while (section.nextElementSibling) {
            const next = section.nextElementSibling;
            if (next.matches('h2, .screenshots, .menu-return-bottom')) break;
            section.appendChild(next);
        }
    });

    const screenshots = content.querySelector(':scope > .screenshots');
    if (screenshots) {
        const images = Array.from(screenshots.querySelectorAll('img'));
        const gallery = document.createElement('section');
        gallery.className = 'project-gallery';
        gallery.setAttribute('aria-labelledby', 'project-gallery-title');

        const galleryHeading = document.createElement('div');
        galleryHeading.className = 'gallery-heading';
        galleryHeading.innerHTML = `
            <h2 id="project-gallery-title">${isEnglish ? 'Project gallery' : 'Галерея проекта'}</h2>
            <p>${isEnglish ? `${images.length} images · click to enlarge` : `${images.length} изображений · нажмите, чтобы увеличить`}</p>`;

        screenshots.before(gallery);
        gallery.append(galleryHeading, screenshots);
        screenshots.classList.toggle('screenshots--many', images.length >= 3);

        images.forEach((image, index) => {
            image.tabIndex = 0;
            image.setAttribute('role', 'button');
            image.setAttribute(
                'aria-label',
                isEnglish ? `Open image ${index + 1} of ${images.length}` : `Открыть изображение ${index + 1} из ${images.length}`,
            );
            image.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                image.click();
            });
        });
    }

    document.querySelectorAll('.lightbox-modal').forEach((modal) => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', isEnglish ? 'Project image viewer' : 'Просмотр изображения проекта');

        const modalImage = modal.querySelector('img');
        const closeButton = modal.querySelector('.lightbox-close');
        const galleryImages = Array.from(document.querySelectorAll('.screenshots img'));
        let returnFocus = null;

        const navigation = [];
        if (modalImage && galleryImages.length > 1) {
            const previous = document.createElement('button');
            previous.type = 'button';
            previous.className = 'lightbox-nav lightbox-nav--prev';
            previous.setAttribute('aria-label', isEnglish ? 'Previous image' : 'Предыдущее изображение');
            previous.textContent = '‹';

            const next = document.createElement('button');
            next.type = 'button';
            next.className = 'lightbox-nav lightbox-nav--next';
            next.setAttribute('aria-label', isEnglish ? 'Next image' : 'Следующее изображение');
            next.textContent = '›';
            modal.append(previous, next);
            navigation.push(previous, next);

            const showRelativeImage = (direction) => {
                const currentIndex = Math.max(0, galleryImages.findIndex((image) => image.src === modalImage.src));
                const nextIndex = (currentIndex + direction + galleryImages.length) % galleryImages.length;
                modalImage.src = galleryImages[nextIndex].src;
                modalImage.alt = galleryImages[nextIndex].alt;
            };

            previous.addEventListener('click', () => showRelativeImage(-1));
            next.addEventListener('click', () => showRelativeImage(1));
            modal.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') showRelativeImage(-1);
                if (event.key === 'ArrowRight') showRelativeImage(1);
            });
        }

        const observer = new MutationObserver(() => {
            const isOpen = modal.classList.contains('is-open');
            if (isOpen) {
                returnFocus = document.activeElement;
                closeButton?.focus();
            } else if (returnFocus instanceof HTMLElement) {
                returnFocus.focus();
                returnFocus = null;
            }
        });
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });

        modal.addEventListener('keydown', (event) => {
            if (event.key !== 'Tab') return;
            const controls = [closeButton, ...navigation].filter(Boolean);
            if (!controls.length) return;

            const currentIndex = controls.indexOf(document.activeElement);
            const direction = event.shiftKey ? -1 : 1;
            const nextIndex = (currentIndex + direction + controls.length) % controls.length;
            event.preventDefault();
            controls[nextIndex].focus();
        });
    });

    const revealTargets = content.querySelectorAll('.project-overview, .project-section, .project-gallery');
    revealTargets.forEach((target) => target.classList.add('case-reveal'));

    if (reducedMotion || compactLayout || !('IntersectionObserver' in window)) {
        revealTargets.forEach((target) => target.classList.add('is-visible'));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
        revealTargets.forEach((target) => revealObserver.observe(target));
    }

    let progressScheduled = false;
    const renderProgress = () => {
        const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const value = Math.min(1, Math.max(0, window.scrollY / range));
        progress.style.transform = `scaleX(${value})`;
        progressScheduled = false;
    };
    const requestProgress = () => {
        if (progressScheduled) return;
        progressScheduled = true;
        window.requestAnimationFrame(renderProgress);
    };

    renderProgress();
    window.addEventListener('scroll', requestProgress, { passive: true });
    window.addEventListener('resize', requestProgress, { passive: true });
})();
