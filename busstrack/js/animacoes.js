/* =========================================================
   BUSSTRACK - animacoes.js  (GSAP)

   Todas as animações do site, feitas com a biblioteca GSAP
   e os plugins ScrollTrigger, SplitText e DrawSVG
   (carregados no fim do index.html).

   ÍNDICE
   0. Arranque e funções de apoio
   1. Abertura da página (barra, texto do início e telemóvel)
   2. Início: montra do telemóvel com scroll (o texto cai e o
      telemóvel mostra 5 ecrãs da app) + inclinação com o rato
   3. Barra de progresso do scroll e sombra da barra de navegação
   4. Cabeçalhos das secções (título palavra a palavra)
   5. Cards (aparecem em grupo, com o ícone a "saltar")
   6. Imagens (revelam-se como uma cortina e têm parallax)
   7. Planos (entram dos lados, preço a contar e brilho no Premium)
   8. Contactos
   9. Rodapé

   Quem tem "reduzir movimento" ligado no sistema não vê
   estas animações (o gsap.matchMedia trata disso).
   ========================================================= */

(function () {
    var root = document.documentElement;

    // Sem GSAP (por exemplo, sem internet): mostra a página normal
    if (!window.gsap || !window.ScrollTrigger) {
        root.classList.remove('anim-wait');
        return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
    if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
    gsap.defaults({ ease: 'power3.out', duration: 0.8 });

    // No telemóvel, a barra do browser a aparecer/desaparecer não obriga
    // a recalcular tudo (evita saltos a meio do scroll)
    ScrollTrigger.config({ ignoreMobileResize: true });

    var heroSplit = null;     // título do início dividido em palavras e letras
    var showcaseTL = null;    // linha temporal da montra (ligada ao scroll)
    var introTL = null;       // linha temporal da abertura


    /* =====================================================
       0. FUNÇÕES DE APOIO
       ===================================================== */

    // Enquanto o GSAP anima, desliga as transições do CSS
    // (senão as duas lutam pelo mesmo "transform")
    function startAnim(targets) {
        gsap.utils.toArray(targets).forEach(function (el) {
            el.classList.add('is-animating');
        });
    }

    // No fim, devolve o elemento ao CSS: o hover volta a funcionar
    function endAnim(targets) {
        var els = gsap.utils.toArray(targets);
        gsap.set(els, { clearProps: 'transform,opacity,visibility' });
        els.forEach(function (el) { el.classList.remove('is-animating'); });
    }

    // Divide um título em palavras, cada uma dentro de uma "máscara"
    // para parecer que sobe de dentro de uma linha invisível
    function splitWords(el) {
        var split = SplitText.create(el, {
            type: 'words',
            mask: 'words',
            wordsClass: 'split-word'
        });
        roomyMasks(split);
        return split;
    }

    // Máscaras um pouco mais altas, para não cortarem as letras com "perna" (g, p, ç...)
    function roomyMasks(split) {
        gsap.set(split.masks, { paddingBottom: '0.12em', marginBottom: '-0.12em' });
    }

    function isDesktop() {
        return window.matchMedia('(min-width: 1001px)').matches;
    }

    // Links do menu (#secção): scroll suave feito pelo GSAP.
    // O "scroll-behavior: smooth" do CSS fica desligado (ver style.css, secção 13)
    // porque lutava com o encaixe da montra e deixava o scroll aos solavancos.
    function smoothLinks() {
        if (!window.ScrollToPlugin) return;
        root.classList.add('gsap-scroll');

        var navbar = document.querySelector('.navbar');

        document.addEventListener('click', function (e) {
            var link = e.target.closest('a[href^="#"]');
            if (!link) return;

            var id = link.getAttribute('href');
            var section = id.length > 1 ? document.querySelector(id) : null;
            if (!section) return;

            e.preventDefault();

            var y = id === '#inicio' ? 0 : section;
            var distance = Math.abs((id === '#inicio' ? 0 : section.getBoundingClientRect().top + window.scrollY) - window.scrollY);

            gsap.to(window, {
                // Mais longe = um pouco mais de tempo, mas nunca mais de 1,6 s
                duration: gsap.utils.clamp(0.6, 1.6, distance / 2500),
                ease: 'power3.inOut',
                overwrite: 'auto',
                scrollTo: { y: y, offsetY: navbar ? navbar.offsetHeight : 0, autoKill: true }
            });

            if (history.pushState) history.pushState(null, '', id);
        });
    }


    // Só arranca quando a fonte Inter estiver carregada
    // (no máximo 700 ms), para as palavras ficarem no sítio certo
    var fontsReady = document.fonts && document.fonts.ready
        ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 700); })])
        : Promise.resolve();

    fontsReady.then(function () {
        // Movimento reduzido: só garante que a página aparece.
        // (Não se usa gsap.matchMedia de propósito: ao recalcular o scroll,
        // o ScrollTrigger voltava a pôr a abertura a correr por cima da montra.)
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            root.classList.remove('anim-wait');
            return;
        }

        // Sem movimento reduzido: tudo animado
        (function () {
            smoothLinks();
            intro();
            showcase();
            scrollProgress();
            sectionHeaders();
            cards();
            images();
            plans();
            contact();
            footer();
        })();
    });


    /* =====================================================
       1. ABERTURA DA PÁGINA
       A barra de navegação desce, o título sobe palavra a
       palavra, o telemóvel entra em 3D e o mapa "desenha-se":
       ruas -> percurso -> paragens -> autocarro -> cartão.
       ===================================================== */
    function intro() {
        // Título dividido em palavras (para a entrada) e letras (para caírem com o scroll)
        var title = document.querySelector('.hero h1');
        var split = title ? SplitText.create(title, {
            type: 'words,chars',
            mask: 'words',
            wordsClass: 'split-word'
        }) : null;
        heroSplit = split;
        if (split) roomyMasks(split);

        // Máscara para desenhar o percurso sem estragar o tracejado animado:
        // uma cópia do percurso, branca, que vai crescendo por cima
        var route = document.querySelector('.phone__route');
        var maskPath = null;
        if (route) {
            var svgNS = 'http://www.w3.org/2000/svg';
            var svg = route.ownerSVGElement;
            var defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(svgNS, 'defs'), svg.firstChild);
            var mask = document.createElementNS(svgNS, 'mask');
            mask.setAttribute('id', 'route-mask');
            mask.setAttribute('maskUnits', 'userSpaceOnUse');
            mask.setAttribute('x', '0');
            mask.setAttribute('y', '0');
            mask.setAttribute('width', '300');
            mask.setAttribute('height', '400');
            maskPath = document.createElementNS(svgNS, 'path');
            maskPath.setAttribute('d', route.getAttribute('d'));
            maskPath.setAttribute('fill', 'none');
            maskPath.setAttribute('stroke', '#fff');
            maskPath.setAttribute('stroke-width', '10');
            maskPath.setAttribute('stroke-linecap', 'round');
            mask.appendChild(maskPath);
            defs.appendChild(mask);
            route.setAttribute('mask', 'url(#route-mask)');
        }

        var uiTargets = '.logo, .nav a, .menu-toggle, .hero__buttons .btn, .dots__dot';
        startAnim(uiTargets);

        var tl = introTL = gsap.timeline({
            defaults: { ease: 'power3.out', duration: 0.8 },
            onComplete: function () {
                endAnim(uiTargets);
                // As máscaras deixam de cortar: as letras podem cair para fora delas
                if (split) gsap.set(split.masks, { overflow: 'visible' });
                phoneTilt();                    // só depois da entrada é que o rato mexe no telemóvel
                // A abertura já não é precisa: é apagada para nunca voltar a correr
                // por cima da montra (o texto fica no estado final)
                introTL = null;
                this.kill();
            }
        });

        // Barra de navegação
        tl.from('.logo', { x: -24, autoAlpha: 0, duration: 0.6 }, 0)
          .from('.nav a', { y: -12, autoAlpha: 0, stagger: 0.05, duration: 0.5 }, 0.1)
          .from('.menu-toggle', { scale: 0.8, autoAlpha: 0, duration: 0.4 }, 0.1);

        // Texto do início
        tl.from('.hero .badge', { y: 16, scale: 0.9, autoAlpha: 0, duration: 0.5 }, 0.2);
        if (split) {
            tl.from(split.words, { yPercent: 110, duration: 0.9, stagger: 0.045, ease: 'power4.out' }, 0.3);
        }
        tl.from('.hero__content > p', { y: 20, autoAlpha: 0 }, '-=0.55')
          .from('.hero__buttons .btn', { y: 20, autoAlpha: 0, stagger: 0.1 }, '-=0.6')
          .from('.hero__features li', { x: -12, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, '-=0.5');

        // Telemóvel: entra a rodar em 3D
        tl.from('.phone', {
            y: 90,
            rotationX: 18,
            rotationY: -14,
            transformPerspective: 1000,
            autoAlpha: 0,
            duration: 1.2
        }, 0.35);

        // Mapa: ruas aparecem em ordem aleatória
        tl.from('.phone__streets path', {
            autoAlpha: 0,
            duration: 0.4,
            stagger: { each: 0.03, from: 'random' }
        }, 1.0);

        // Percurso desenha-se de baixo para cima e as paragens
        // acendem quando a linha chega até elas
        if (maskPath) {
            tl.addLabel('route', 1.3)
              .fromTo(maskPath, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, ease: 'power2.inOut' }, 'route');
        } else {
            tl.addLabel('route', 1.3);
        }
        tl.from('.phone__stop', {
            scale: 0,
            transformOrigin: '50% 50%',
            duration: 0.5,
            ease: 'back.out(3)',
            stagger: 0.4
        }, 'route+=0.55')
          .from('.phone__label', { y: 8, autoAlpha: 0, duration: 0.5 }, 'route+=1.4')
          .from('.phone__bus', { autoAlpha: 0, duration: 0.6 }, 'route+=1.3')
          .from('.phone__info', { y: 40, autoAlpha: 0, duration: 0.7 }, 'route+=0.9');

        // Pontos laterais
        tl.from('.dots__dot', { x: 20, autoAlpha: 0, stagger: 0.06, duration: 0.4 }, 0.9);

        // Os estados iniciais já estão aplicados: pode mostrar a página
        root.classList.remove('anim-wait');

        // "AO VIVO" a piscar devagar
        gsap.to('.badge-live', { opacity: 0.35, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true });
    }


    /* =====================================================
       2. INÍCIO: MONTRA DO TELEMÓVEL
       O início fica preso no ecrã enquanto fazes scroll:
         1) as letras do título caem e o resto do texto vai atrás;
         2) o telemóvel viaja para o centro, a rodar em 3D;
         3) os ecrãs da app vão trocando (mapa -> paragens ->
            chegada -> alertas -> perfil), com o texto de cada
            funcionalidade ao lado, letra a letra a descer.
       O scroll controla tudo (scrub), por isso também anda para trás.
       ===================================================== */
    var ACCENT = '#38bdf8';
    var SOFT = '#94a3b8';

    // Posição de um elemento dentro de outro, sem contar com transformações
    function offsetIn(el, ancestor) {
        var x = 0, y = 0;
        while (el && el !== ancestor) {
            x += el.offsetLeft;
            y += el.offsetTop;
            el = el.offsetParent;
        }
        return { x: x, y: y };
    }

    function showcase() {
        var hero = document.querySelector('.hero');
        var wrap = document.querySelector('.phone-wrap');
        var navbar = document.querySelector('.navbar');
        var captions = gsap.utils.toArray('.showcase__caption');
        var screens = gsap.utils.toArray('.phone .screen');
        if (!hero || !wrap || !navbar || captions.length !== 5 || screens.length !== 4) return;

        root.classList.add('has-showcase');

        var map = document.querySelector('.phone__map');
        var info = document.querySelector('.phone__info');
        var tabBar = document.querySelector('.phone__tabs');
        var tabs = gsap.utils.toArray('.phone__tab');
        var indicator = document.querySelector('.phone__tab-indicator');
        var stepsBox = document.querySelector('.showcase__steps');
        var steps = gsap.utils.toArray('.showcase__steps li');
        var stepsBar = document.querySelector('.showcase__bar span');
        var capBox = document.querySelector('.showcase__captions');
        var dots = document.querySelector('.dots');
        // Os botões mexem-se pela caixa (.hero__buttons) para não estragar o hover deles
        var heroText = gsap.utils.toArray('.hero .badge, .hero__content > p, .hero__buttons, .hero__features li');

        // Para onde vai o telemóvel (calculado de novo sempre que o ecrã muda de tamanho)
        function target() {
            var visH = window.innerHeight - navbar.offsetHeight;
            var pos = offsetIn(wrap, hero);
            var w = wrap.offsetWidth;
            var h = wrap.offsetHeight;
            var cx = hero.clientWidth / 2 - (pos.x + w / 2);

            if (isDesktop()) {
                // Computador: centro do ecrã
                var s = Math.min(1.05, (visH - 48) / h);
                return { x: cx, y: visH / 2 - (pos.y + h / 2), s: s };
            }

            // Tablet/telemóvel: por baixo dos textos, encolhido para caber
            var capBottom = offsetIn(capBox, hero).y + capBox.offsetHeight;
            var sm = Math.min(0.95, (visH - capBottom - 24) / h);
            return { x: cx, y: capBottom + 14 + (h * sm) / 2 - (pos.y + h / 2), s: sm };
        }

        // ---- Estados iniciais (tudo o que só aparece com o scroll) ----
        var capSplits = captions.map(function (c) {
            return SplitText.create(c.querySelector('.showcase__title'), { type: 'words,chars' });
        });
        captions.forEach(function (c, i) {
            gsap.set([c.querySelector('.showcase__num'), c.querySelector('.showcase__text')], { autoAlpha: 0 });
            gsap.set(capSplits[i].chars, { autoAlpha: 0, transformPerspective: 400 });
        });

        gsap.set(wrap, { transformPerspective: 1200 });
        gsap.set(indicator, { xPercent: 200 });                 // separador "Mapa"
        gsap.set(tabs, { color: function (k) { return k === 2 ? ACCENT : SOFT; } });
        gsap.set(steps, { color: 'rgba(148, 163, 184, 0.55)' });

        // Detalhes de cada ecrã que aparecem depois de ele entrar
        var home = screens[0], line = screens[1], alerts = screens[2], profile = screens[3];
        var homeItems = home.querySelectorAll('.screen__top, .app-search, .app-label, .app-card, .app-row');
        var lineRing = line.querySelector('.eta__progress');
        var lineNum = line.querySelector('.eta__num');
        var lineStops = line.querySelectorAll('.timeline li');
        var lineBus = line.querySelector('.timeline__bus');
        var alertPush = alerts.querySelector('.push');
        var alertItems = alerts.querySelectorAll('.screen__top, .app-row');
        var toggles = alerts.querySelectorAll('.toggle');
        var knobs = alerts.querySelectorAll('.toggle span');
        var profAvatar = profile.querySelector('.profile__avatar');
        var profItems = profile.querySelectorAll('.profile .screen__title, .premium-badge, .app-label, .app-row, .perks li');
        var stars = profile.querySelectorAll('.app-star');

        gsap.set(homeItems, { autoAlpha: 0, x: 26 });
        gsap.set(lineRing, { drawSVG: '0%' });
        // O autocarro da linha começa junto à 2.ª paragem
        function stopY(i) { return lineStops[i].offsetTop + lineStops[i].offsetHeight / 2 - 11.5; }
        gsap.set(lineBus, { y: stopY(1) });
        gsap.set(alertPush, { yPercent: -170, autoAlpha: 0 });
        gsap.set(alertItems, { autoAlpha: 0, x: 26 });
        gsap.set(profAvatar, { scale: 0.5, autoAlpha: 0 });
        gsap.set(profItems, { autoAlpha: 0, y: 14 });
        gsap.set(stars, { scale: 0, rotation: -120, transformOrigin: '50% 50%' });

        // ---- Linha temporal ligada ao scroll ----
        var tl = gsap.timeline({
            defaults: { ease: 'power2.inOut', duration: 1 },
            scrollTrigger: {
                trigger: hero,
                start: function () { return 'top ' + navbar.offsetHeight; },
                // Cerca de 4,5 ecrãs de scroll para toda a montra (~0,8 ecrã por funcionalidade)
                end: function () { return '+=' + Math.round(window.innerHeight * 4.5); },
                pin: true,
                // 0.5 s de suavização: acompanha o scroll de perto, sem solavancos
                scrub: 0.5,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                fastScrollEnd: true,      // se passares a correr pela montra, ela acaba logo certa
                // Se começares o scroll antes de a abertura acabar, ela salta
                // logo para o fim (senão as duas animações lutavam pelo texto)
                onUpdate: function (self) {
                    if (self.progress > 0 && introTL && introTL.isActive()) introTL.progress(1);
                    // Durante a montra, a lista de passos substitui os pontos laterais
                    if (dots) dots.classList.toggle('is-hidden', self.progress > 0.02 && self.progress < 0.98);
                }
                // Sem "snap" (encaixe) de propósito: o scroll é sempre de quem
                // está a usar o site. Com encaixe, um scroll pequeno era puxado
                // para trás e parecia que a página não respondia.
            }
        });
        showcaseTL = tl;

        tl.addLabel('inicio', 0);

        // 1) As letras do título caem, cada uma para o seu lado
        if (heroSplit) {
            tl.to(heroSplit.chars, {
                y: function () { return window.innerHeight * gsap.utils.random(0.55, 1.1); },
                rotation: function () { return gsap.utils.random(-75, 75); },
                autoAlpha: 0,
                ease: 'power2.in',
                duration: 0.9,
                stagger: { each: 0.006, from: 'random' }
            }, 0);
        }
        // ...e o resto do texto vai atrás
        tl.to(heroText, {
            y: function (i) { return window.innerHeight * (0.45 + i * 0.04); },
            autoAlpha: 0,
            ease: 'power2.in',
            duration: 0.8,
            stagger: 0.04
        }, 0.08);

        // 2) O telemóvel viaja para o centro, a rodar em 3D
        tl.fromTo(wrap, { x: 0, y: 0, scale: 1 }, {
            x: function () { return target().x; },
            y: function () { return target().y; },
            scale: function () { return target().s; },
            duration: 1.25,
            immediateRender: false
        }, 0.15)
          .to(wrap, {
              keyframes: { rotationY: [0, -18, 0], rotationX: [0, 8, 0], easeEach: 'sine.inOut' },
              duration: 1.25,
              ease: 'none'
          }, 0.15);

        // Aparece a barra de separadores e o cartão do mapa sobe para lhe dar espaço
        tl.fromTo(info, { y: 0 }, { y: -58, duration: 0.5, immediateRender: false }, 0.9)
          .fromTo(tabBar, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, immediateRender: false }, 0.9)
          .fromTo(stepsBox, { x: 30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, immediateRender: false }, 1.0);

        // Texto de uma funcionalidade: as letras descem até ao sítio
        function captionIn(i, at) {
            var c = captions[i];
            tl.fromTo(c.querySelector('.showcase__num'), { y: -24, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out', immediateRender: false }, at)
              .fromTo(capSplits[i].chars, { y: -70, rotationX: -80, autoAlpha: 0 },
                { y: 0, rotationX: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', stagger: 0.018, immediateRender: false }, at + 0.05)
              .fromTo(c.querySelector('.showcase__text'), { y: -20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', immediateRender: false }, at + 0.3)
              .to(steps, {
                  color: function (k) { return k === i ? '#ffffff' : 'rgba(148, 163, 184, 0.55)'; },
                  duration: 0.4
              }, at)
              .to(stepsBar, { scaleY: (i + 1) / 5, duration: 0.6 }, at);
        }

        // ...e depois as letras continuam a descer e desaparecem
        function captionOut(i, at) {
            var c = captions[i];
            tl.to(c.querySelector('.showcase__num'), { y: 30, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, at)
              .to(capSplits[i].chars, {
                  y: 60,
                  rotation: function () { return gsap.utils.random(-25, 25); },
                  autoAlpha: 0,
                  duration: 0.45,
                  ease: 'power2.in',
                  stagger: { each: 0.01, from: 'random' }
              }, at)
              .to(c.querySelector('.showcase__text'), { y: 30, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, at + 0.05);
        }

        // Troca de ecrã dentro do telemóvel
        function swap(outEls, inEl, tabIndex, at) {
            tl.to(outEls, { autoAlpha: 0, yPercent: -6, scale: 0.96, duration: 0.5, ease: 'power2.in' }, at)
              .fromTo(inEl, { autoAlpha: 0, yPercent: 8, scale: 1.04 },
                { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.6, ease: 'power3.out', immediateRender: false }, at + 0.35)
              .to(indicator, { xPercent: tabIndex * 100, duration: 0.6, ease: 'power3.inOut' }, at + 0.2)
              .to(tabs, { color: function (k) { return k === tabIndex ? ACCENT : SOFT; }, duration: 0.4 }, at + 0.35)
              .to(wrap, { keyframes: { rotationY: [0, 7, 0], easeEach: 'sine.inOut' }, duration: 1, ease: 'none' }, at);
        }

        // Ecrã 1: mapa
        captionIn(0, 1.0);
        tl.addLabel('mapa', 1.8);

        // Ecrã 2: paragens perto de ti
        var t = 2.2;
        captionOut(0, t);
        swap([map, info], home, 0, t);
        captionIn(1, t + 0.45);
        tl.to(homeItems, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06 }, t + 0.5);
        tl.addLabel('paragens', t + 1.8);

        // Ecrã 3: previsão de chegada (anel enche, minutos descem, autocarro anda)
        t = 4.4;
        captionOut(1, t);
        swap(home, line, 1, t);
        captionIn(2, t + 0.45);
        var count = { v: 6 };
        tl.to(lineRing, { drawSVG: '0% 72%', duration: 1.2 }, t + 0.5)
          .to(count, {
              v: 2,
              duration: 1.3,
              ease: 'none',
              onUpdate: function () { lineNum.textContent = Math.ceil(count.v - 0.001); }
          }, t + 0.5)
          .to(lineBus, { y: function () { return stopY(1) + (stopY(2) - stopY(1)) * 0.8; }, duration: 1.3, ease: 'none' }, t + 0.5);
        tl.addLabel('chegada', t + 1.8);

        // Ecrã 4: alertas (a notificação cai do topo e os interruptores ligam-se)
        t = 6.6;
        captionOut(2, t);
        swap(line, alerts, 3, t);
        captionIn(3, t + 0.45);
        tl.to(alertItems, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.07 }, t + 0.45)
          .to(alertPush, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'back.out(1.6)' }, t + 0.7)
          .to(knobs, { x: 14, duration: 0.3, stagger: 0.15 }, t + 1.0)
          .to(toggles, { backgroundColor: ACCENT, duration: 0.3, stagger: 0.15 }, t + 1.0);
        tl.addLabel('alertas', t + 1.8);

        // Ecrã 5: perfil, favoritos e Premium (as estrelas acendem)
        t = 8.8;
        captionOut(3, t);
        swap(alerts, profile, 4, t);
        captionIn(4, t + 0.45);
        tl.to(profAvatar, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' }, t + 0.45)
          .to(profItems, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.06 }, t + 0.6)
          .to(stars, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)', stagger: 0.12 }, t + 0.95);
        tl.addLabel('premium', t + 1.8);

        // 3) Saída: o telemóvel ganha balanço para a direita
        //    e sai disparado pela esquerda, a rodar
        t = 11.0;
        captionOut(4, t);

        // Até onde tem de ir para sair completamente do ecrã pela esquerda
        function exitX() {
            var pos = offsetIn(wrap, hero);
            return -(pos.x + wrap.offsetWidth) - 160;
        }

        tl.to(stepsBox, { x: 30, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, t)
          // balanço (antecipação)
          .to(wrap, {
              x: function () { return target().x + 46; },
              rotation: 5,
              rotationY: 14,
              duration: 0.4,
              ease: 'power2.out'
          }, t)
          // e lá vai ele
          .to(wrap, {
              x: exitX,
              y: function () { return target().y - 50; },
              rotation: -18,
              rotationY: -38,
              scale: function () { return target().s * 0.88; },
              duration: 0.9,
              ease: 'power3.in'
          }, t + 0.4)
          .to(wrap, { autoAlpha: 0, duration: 0.2, ease: 'none' }, t + 1.1);

        // Pequena pausa com o ecrã limpo antes de a página continuar
        tl.to({}, { duration: 0.4 }, t + 1.3);
        tl.addLabel('fim');
    }

    function phoneTilt() {
        var hero = document.querySelector('.hero');
        var phone = document.querySelector('.phone');
        if (!hero || !phone) return;

        // Só em ecrãs com rato
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        gsap.set(phone, { transformPerspective: 1000 });

        var rotY = gsap.quickTo(phone, 'rotationY', { duration: 0.6, ease: 'power3' });
        var rotX = gsap.quickTo(phone, 'rotationX', { duration: 0.6, ease: 'power3' });

        // Posição do rato no ecrã (-0.5 a 0.5) -> graus de inclinação
        var toDeg = gsap.utils.mapRange(-0.5, 0.5, -9, 9);

        function onMove(e) {
            // Durante a montra o telemóvel já se mexe com o scroll: fica direito
            if (showcaseTL && showcaseTL.scrollTrigger && showcaseTL.scrollTrigger.progress > 0.01) {
                rotY(0); rotX(0);
                return;
            }
            var x = e.clientX / window.innerWidth - 0.5;
            var y = e.clientY / window.innerHeight - 0.5;
            rotY(toDeg(x));
            rotX(-toDeg(y));
        }

        function onLeave() {
            rotY(0); rotX(0);
        }

        hero.addEventListener('mousemove', onMove);
        hero.addEventListener('mouseleave', onLeave);
    }


    /* =====================================================
       3. BARRA DE PROGRESSO + SOMBRA DA NAVEGAÇÃO
       ===================================================== */
    function scrollProgress() {
        var bar = document.createElement('div');
        bar.className = 'scroll-progress';
        bar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(bar);

        gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' });
        gsap.to(bar, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
        });

        // A barra de navegação ganha sombra quando já não estás no topo
        ScrollTrigger.create({
            start: 10,
            end: 'max',
            toggleClass: { targets: '.navbar', className: 'is-scrolled' }
        });
    }


    /* =====================================================
       4. CABEÇALHOS DAS SECÇÕES
       Etiqueta (eyebrow) aproxima as letras, título sobe palavra
       a palavra, texto e botão aparecem a seguir.
       ===================================================== */
    function sectionHeaders() {
        gsap.utils.toArray('.section-title').forEach(function (titleEl) {
            var box = titleEl.closest('.section-header, .split__text') || titleEl.parentElement;
            var eyebrow = box.querySelector('.eyebrow');
            var texts = box.querySelectorAll(':scope > .section-lead, :scope > .lead');
            var button = box.querySelector(':scope > .btn');
            var split = splitWords(titleEl);

            if (button) startAnim(button);

            var tl = gsap.timeline({
                scrollTrigger: { trigger: box, start: 'top 82%', once: true },
                onComplete: function () {
                    split.revert();
                    if (button) endAnim(button);
                }
            });

            if (eyebrow) {
                tl.from(eyebrow, { autoAlpha: 0, y: 10, letterSpacing: '8px', duration: 0.7 }, 0);
            }
            tl.from(split.words, { yPercent: 110, duration: 0.8, stagger: 0.06, ease: 'power4.out' }, 0.1);
            if (texts.length) {
                tl.from(texts, { y: 20, autoAlpha: 0, stagger: 0.12 }, 0.35);
            }
            if (button) {
                tl.from(button, { y: 20, autoAlpha: 0 }, '-=0.4');
            }
        });
    }


    /* =====================================================
       5. CARDS
       Os cards que entram no ecrã ao mesmo tempo aparecem
       em grupo, um a seguir ao outro. O ícone "salta" e as
       listas aparecem linha a linha.
       ===================================================== */
    function cards() {
        var all = gsap.utils.toArray('.grid > .card, .stack > .card');
        if (!all.length) return;

        gsap.set(all, { autoAlpha: 0, y: 50 });

        ScrollTrigger.batch(all, {
            start: 'top 88%',
            once: true,
            onEnter: function (batch) {
                startAnim(batch);

                var icons = [];
                var items = [];
                batch.forEach(function (card) {
                    var icon = card.querySelector('.card__icon, .icon-box');
                    if (icon) icons.push(icon);
                    items = items.concat(gsap.utils.toArray(card.querySelectorAll('.list li')));
                });

                var tl = gsap.timeline({
                    onComplete: function () {
                        endAnim(batch);
                        gsap.set(icons.concat(items), { clearProps: 'transform,opacity,visibility' });
                    }
                });

                tl.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0);
                if (icons.length) {
                    tl.from(icons, { scale: 0, rotation: -25, duration: 0.6, stagger: 0.12, ease: 'back.out(2.2)' }, 0.15);
                }
                if (items.length) {
                    tl.from(items, { x: -16, autoAlpha: 0, duration: 0.45, stagger: 0.07 }, 0.4);
                }
            }
        });
    }


    /* =====================================================
       6. IMAGENS
       Abrem como uma cortina (do lado de fora para dentro)
       e depois mexem-se um pouco mais devagar que o scroll.
       ===================================================== */
    function images() {
        gsap.utils.toArray('.split__media').forEach(function (media) {
            var img = media.querySelector('img');
            if (!img) return;

            // No computador a imagem do produto está à direita: abre da direita
            var fromRight = !!media.closest('#bustrack') && isDesktop();
            var hidden = fromRight
                ? 'inset(0% 0% 0% 100% round 16px)'
                : 'inset(0% 100% 0% 0% round 16px)';
            var shown = 'inset(0% 0% 0% 0% round 16px)';

            gsap.timeline({ scrollTrigger: { trigger: media, start: 'top 80%', once: true } })
                .fromTo(media, { clipPath: hidden }, { clipPath: shown, duration: 1.3, ease: 'power4.inOut' }, 0)
                .fromTo(img, { scale: 1.35 }, { scale: 1.12, duration: 1.6 }, 0);

            // Parallax (a imagem fica ampliada 12% para nunca se verem as bordas)
            gsap.fromTo(img, { yPercent: -4 }, {
                yPercent: 4,
                ease: 'none',
                scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });
    }


    /* =====================================================
       7. PLANOS
       ===================================================== */
    function plans() {
        var cardsEls = gsap.utils.toArray('.plan');
        if (!cardsEls.length) return;

        var desktop = isDesktop();
        var buttons = gsap.utils.toArray('.plan .btn--plan');
        startAnim(cardsEls.concat(buttons));

        var tl = gsap.timeline({
            scrollTrigger: { trigger: '.plans', start: 'top 80%', once: true },
            onComplete: function () {
                endAnim(cardsEls.concat(buttons));
                gsap.set('.plan__features li', { clearProps: 'transform,opacity,visibility' });
                shine();
            }
        });

        // Gratuito vem da esquerda, Premium da direita (no telemóvel vêm de baixo)
        tl.from(cardsEls, {
            autoAlpha: 0,
            y: 60,
            x: function (i) { return desktop ? (i === 0 ? -70 : 70) : 0; },
            rotation: function (i) { return desktop ? (i === 0 ? -4 : 4) : 0; },
            duration: 1,
            stagger: 0.15
        }, 0);

        tl.from('.plan__features li', { x: -14, autoAlpha: 0, duration: 0.35, stagger: 0.03 }, 0.45)
          .from(buttons, { y: 16, autoAlpha: 0, duration: 0.5, stagger: 0.15 }, '-=0.25');

        // Preço a contar desde 0 (ex.: 0,00€ -> 2,99€)
        gsap.utils.toArray('.plan__value').forEach(function (el) {
            var text = el.textContent.trim();
            var value = parseFloat(text.replace(',', '.'));
            if (!value) return;

            var decimals = (text.split(',')[1] || '').replace(/\D/g, '').length;
            var counter = { v: 0 };
            el.textContent = (0).toFixed(decimals).replace('.', ',') + '€';

            tl.to(counter, {
                v: value,
                duration: 1.4,
                ease: 'power2.out',
                onUpdate: function () {
                    el.textContent = counter.v.toFixed(decimals).replace('.', ',') + '€';
                }
            }, 0.35);
        });
    }

    // Reflexo de luz que passa de vez em quando pelo plano Premium
    function shine() {
        var premium = document.querySelector('.plan--premium');
        if (!premium) return;

        var light = document.createElement('span');
        light.className = 'plan__shine';
        light.setAttribute('aria-hidden', 'true');
        premium.appendChild(light);

        gsap.fromTo(light, { xPercent: -150, skewX: -18 }, {
            xPercent: 350,
            duration: 1.4,
            ease: 'power2.inOut',
            repeat: -1,
            repeatDelay: 3.5,
            // Pára quando o plano sai do ecrã (poupa bateria)
            scrollTrigger: { trigger: premium, toggleActions: 'play pause resume pause' }
        });
    }


    /* =====================================================
       8. CONTACTOS
       ===================================================== */
    function contact() {
        var card = document.querySelector('.contact-card');
        if (!card) return;

        gsap.timeline({
            scrollTrigger: { trigger: card, start: 'top 82%', once: true },
            onComplete: function () {
                gsap.set(card.querySelectorAll('*'), { clearProps: 'transform,opacity,visibility' });
                gsap.set(card, { clearProps: 'transform,opacity,visibility' });
            }
        })
            .from(card, { y: 50, scale: 0.94, autoAlpha: 0, duration: 0.9 }, 0)
            .from('.contact-card__logo', { scale: 0, rotation: -90, duration: 0.7, ease: 'back.out(2)' }, 0.25)
            .from('.contact-card__name, .contact-card__country', { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, 0.4)
            .from('.contact-item', { x: -24, autoAlpha: 0, duration: 0.6, stagger: 0.12 }, 0.55)
            .from('.notice', { y: 16, autoAlpha: 0, duration: 0.6 }, '-=0.2')
            // O ícone de aviso abana um bocadinho para chamar a atenção
            .to('.notice .icon', {
                keyframes: { rotation: [0, -14, 12, -8, 6, 0] },
                duration: 0.7,
                ease: 'none',
                transformOrigin: '50% 80%'
            }, '-=0.1');
    }


    /* =====================================================
       9. RODAPÉ
       ===================================================== */
    function footer() {
        if (!document.querySelector('.footer')) return;

        gsap.timeline({
            scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true },
            onComplete: function () {
                gsap.set('.footer__col, .footer__region, .footer__bottom', { clearProps: 'transform,opacity,visibility' });
            }
        })
            .from('.footer__col', { y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.1 }, 0)
            .from('.footer__region, .footer__bottom', { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, '-=0.3');
    }
})();
