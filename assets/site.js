(() => {
    const year = document.querySelector('[data-current-year]');
    if (year) year.textContent = new Date().getFullYear();

    document.querySelectorAll('[data-print]').forEach((button) => {
        button.addEventListener('click', () => window.print());
    });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactEffects = window.matchMedia('(max-width: 780px), (pointer: coarse)').matches;

    function createGameWorld() {
        if (reducedMotion) return;

        const allGames = [
            { src: 'images/UgaDooga/uga-dooga.jpg', x: 5, y: 23, start: 0.03, rotation: -7 },
            { src: 'images/magic-solution/magic-solution-icon.jpg', x: 95, y: 20, start: 0.15, rotation: 6 },
            { src: 'images/ayist-games/ayist-games-icon-512.jpg', x: 94, y: 48, start: 0.32, rotation: -5 },
            { src: 'images/meltopia/meltopia-header.jpg', x: 6, y: 61, start: 0.48, rotation: 7 },
            { src: 'images/Mind-alchemy/Mind-alchemy_Icon.png', x: 95, y: 79, start: 0.64, rotation: -6 },
            { src: 'images/Cursed Labyrinth/CursedLabyrinth_Icon.png', x: 5, y: 87, start: 0.78, rotation: 5 },
        ];
        const games = compactEffects ? allGames.slice(0, 3) : allGames;

        const world = document.createElement('div');
        world.className = `game-world${compactEffects ? ' game-world--compact' : ''}`;
        world.setAttribute('aria-hidden', 'true');
        world.innerHTML = `
            <svg class="game-world__map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                    <linearGradient id="game-world-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#2fb9ff" />
                        <stop offset="0.52" stop-color="#78d6ff" />
                        <stop offset="1" stop-color="#9f7cff" />
                    </linearGradient>
                </defs>
                <path class="game-world__path" d="M 5 23 C 29 8, 68 11, 95 20 S 99 43, 94 48 S 33 49, 6 61 S 49 75, 95 79 S 41 95, 5 87" />
            </svg>`;

        const tiles = games.map((game, index) => {
            const tile = document.createElement('div');
            tile.className = 'game-world__tile';
            tile.style.setProperty('--tile-x', `${game.x}%`);
            tile.style.setProperty('--tile-y', `${game.y}%`);
            tile.style.setProperty('--tile-rotation', `${game.rotation}deg`);
            tile.style.setProperty('--tile-delay', `${index * 45}ms`);
            const image = document.createElement('img');
            image.alt = '';
            image.loading = 'lazy';
            image.decoding = 'async';
            image.width = 240;
            image.height = 176;
            tile.appendChild(image);
            world.appendChild(tile);

            const node = document.createElement('span');
            node.className = 'game-world__node';
            node.style.setProperty('--node-x', `${game.x}%`);
            node.style.setProperty('--node-y', `${game.y}%`);
            world.appendChild(node);

            return { ...game, tile, node, image, visible: false };
        });

        document.body.prepend(world);

        const path = world.querySelector('.game-world__path');
        const pathLength = path?.getTotalLength() || 300;
        if (path) {
            path.style.strokeDasharray = `${pathLength}`;
            path.style.strokeDashoffset = `${pathLength}`;
        }

        const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
        let scheduled = false;
        let lastProgress = -1;

        const render = () => {
            scheduled = false;
            if (document.hidden) return;

            const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const progress = clamp(window.scrollY / scrollRange);
            if (Math.abs(progress - lastProgress) < 0.003 && lastProgress >= 0) return;
            lastProgress = progress;

            if (path) {
                const lineProgress = clamp((progress - 0.01) / 0.9);
                path.style.strokeDashoffset = `${Math.round(pathLength * (1 - lineProgress))}`;
            }

            tiles.forEach((game) => {
                const shouldShow = progress >= game.start;
                if (shouldShow === game.visible) return;
                game.visible = shouldShow;
                if (shouldShow && !game.image.src) game.image.src = game.src;
                game.tile.classList.toggle('is-visible', shouldShow);
                game.node.classList.toggle('is-visible', shouldShow);
            });
        };

        const requestRender = () => {
            if (scheduled) return;
            scheduled = true;
            window.requestAnimationFrame(render);
        };

        render();
        window.addEventListener('scroll', requestRender, { passive: true });
        window.addEventListener('resize', requestRender, { passive: true });
        document.addEventListener('visibilitychange', requestRender);
    }

    function enableScrollReveals() {
        const targets = document.querySelectorAll([
            '.section-heading',
            '.case-card',
            '.latest-callout',
            '.experience-row',
            '.skill-group',
            '.project-card',
            '.catalog-heading',
            '.project-mini-card',
            '.process-card',
            '.contact-card',
        ].join(','));

        targets.forEach((target, index) => {
            target.classList.add('reveal-item');
            target.style.setProperty('--reveal-delay', `${(index % 3) * 55}ms`);
        });

        if (reducedMotion || compactEffects || !('IntersectionObserver' in window)) {
            targets.forEach((target) => target.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -5% 0px', threshold: 0.06 });

        targets.forEach((target) => observer.observe(target));
    }

    const startVisuals = () => {
        createGameWorld();
        enableScrollReveals();
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(startVisuals, { timeout: 700 });
    } else {
        window.setTimeout(startVisuals, 80);
    }
})();
