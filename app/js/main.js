document.addEventListener('scroll', () => {
	const header = $('.header_js');
	if (window.scrollY >= 50) return header.classList.add('header_scrolled');
	header.classList.remove('header_scrolled');
});
// mob menu
$('.btn_mob_js').onclick = event => {
	$('.nav_holder_js').classList.toggle('opened');
	event.target.classList.toggle('opened');
};

if ($('#roadmap') && window.innerWidth > 1280) mapReveal();
if ($('.img_decor')) controlAsideDecor();
if ($('.img_block') && window.innerWidth > 1280) revealImages();
if ($('.hero_block')) parallax();
if ($('.main_nav')) smoothAutoScroll();
if ($('.js_posters_gallery')) enableGalleries();

function mapReveal() {

	const SCREEN_MARGIN = 300;
	const MAP_SELECTOR = '#roadmap';
	const MAP_START = getMapStart();
	const ROUTE_LENGTH = 5280;
	const MAP_HEIGHT = 1920;

	const map = $(MAP_SELECTOR);
	const textBlocks = $$('[class *= "step_"]');
	const artwork = Array.from($('.paint_part').children);

	new Route();
	updateOnScroll();
	animateTextBlocks(textBlocks);
	animateArtwork(artwork);

	function updateOnScroll() {

		window.addEventListener('scroll', handleScroll);

		function handleScroll() {

			const scrollTop = document.documentElement.scrollTop;

			if (scrollTop < ROUTE_LENGTH || scrollTop > ROUTE_LENGTH + MAP_HEIGHT) return;

			const shiftBottomMargin = scrollTop + window.innerHeight - SCREEN_MARGIN;
			const progress = (shiftBottomMargin - MAP_START) / MAP_HEIGHT;

			const event = new CustomEvent('progress-update', { detail: progress });
			map.dispatchEvent(event);

		}

	}
	function getMapStart() {
		const target = document.querySelector(MAP_SELECTOR);
		return target.getBoundingClientRect().top + document.documentElement.scrollTop;
	}
	function animateTextBlocks(elements) {

		elements.forEach(elem => {

			elem.style.cssText = '-webkit-mask-size: 0px 0px; mask-size: 0px 0px';

			const mark = +elem.dataset.mark;

			const handleEvent = function(event) {
				if (event.detail < mark) return;
				map.removeEventListener('progress-update', handleEvent);
				revealTextBlock(elem);
			};

			map.addEventListener('progress-update', handleEvent);

		});

		function revealTextBlock(elem) {

			let steps = 0;
			const MAX_SIZE = 2000;

			const time = setInterval(() => {

				steps += 1;
				value = easeOutCirc(steps / MAX_SIZE);
				const size = MAX_SIZE * value;

				elem.style.cssText = `-webkit-mask-size: ${size}px; mask-size: ${size}px`;

				if (size >= MAX_SIZE) clearInterval(time);

			}, 16);

		}

	}
	function animateArtwork(elements) {

		elements.forEach(element => {

			element.classList.add('hidden');

			const mark = +element.dataset.mark;

			const handleEvent = function(event) {
				if (event.detail < mark) return;
				map.removeEventListener('progress-update', handleEvent);
				element.classList.remove('hidden');
			};

			map.addEventListener('progress-update', handleEvent);

		});

	}
	function Route() {

		const mask = document.querySelector('#pathmask').firstElementChild;
		let overallProgress = 0;

		gsap.set(mask, {
			duration: 1,
			attr: { ["stroke-dashoffset"]: ROUTE_LENGTH }
		});

		map.addEventListener('progress-update', handleEvent);

		function handleEvent(event) {

			const range = {
				start: 0,
				end: 0.85
			};
			const progress = event.detail;
			let adjustedProgress = (progress - range.start) / (range.end - range.start);
			if (adjustedProgress > 1) adjustedProgress = 1;

			if (adjustedProgress > overallProgress) {
				overallProgress = adjustedProgress;

				const maskLength = ROUTE_LENGTH * (1 - adjustedProgress);
				gsap.to(mask, {
					duration: 1,
					attr: { ["stroke-dashoffset"]: maskLength },
					ease: 'power2.out'
				});
			}

			if (event.detail >= 0.9) {
				mask.setAttribute('stroke-dashoffset', 0);
				map.removeEventListener('progress-update', handleEvent);
			}

		}

	}

}
function controlAsideDecor() {

	const BREAKPOINT = 1280;
	const postItems = $$('.post_item');

	if (window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches) {
		move('in');
	} else {
		move('out');
	}

	window.matchMedia(`(max-width: ${BREAKPOINT}px)`).onchange = condition => {
		if (condition.matches) return move('in');
		move('out');
	}

	function move(direction) {

		postItems.forEach(item => {

			const decor = item.querySelector('.img_decor');
			let textCont = item.querySelector('.text_cont');

			if (direction === 'in') return textCont.appendChild(decor);
			item.appendChild(decor);

		});

	}

}
function revealImages() {

	const posts = $$('.post_item');

	const options = {
		root: null,
		rootMargin: '0px 0px -100px 0px',
		threshold: 1
	}

	let callback = (entries, observer) => {
		entries.forEach(entry => {

			if (entry.isIntersecting) {

				iObserver.unobserve(entry.target)

				const contentBlock = entry.target.parentElement.parentElement;

				let image;

				if (contentBlock.parentElement.classList.contains('token_section')) {
					image = contentBlock.parentElement.querySelector('.img_block');
				} else {
					image = contentBlock.querySelector('.img_block');
				}

				if (image) {

					let steps = 0;
					const MAX_SIZE = 6000;

					const time = setInterval(() => {

						steps += 5;
						value = easeOutExpo(steps / MAX_SIZE);
						const size = MAX_SIZE * value;

						image.style.cssText = `-webkit-mask-size: ${size}px; mask-size: ${size}px`;

						if (size >= MAX_SIZE) clearInterval(time);

					}, 16);

				}

			}

		});
	};

	const iObserver = new IntersectionObserver(callback, options);

	posts.forEach(post => {

		iObserver.observe(post.querySelector('.text_cont > p:first-child'));

		let image;

		if (post.parentElement.classList.contains('token_section')) {
			image = post.parentElement.querySelector('.img_block');
		} else {
			image = post.querySelector('.img_block');
		}

		image.style.cssText = '-webkit-mask-size: 0px; mask-size: 0px';

	});

}
function parallax() {

	const banner = $('.banner_anim');
	const mountains = $('.banner_anim .mountains');
	const clouds1 = $('.banner_anim .clouds1');
	const clouds2 = $('.banner_anim .clouds2');
	const clouds3 = $('.banner_anim .clouds3');
	const town = $('.banner_anim .town');
	const camp = $('.banner_anim .camp');
	const templar = $('.banner_anim .templar');
	const templarhand = $('.banner_anim .templarhand');
	const merch = $('.banner_anim .merc');
	const merchhand = $('.banner_anim .merchand');
	const coin = $('.banner_anim .coin');
	const smokeCenter = $('.smoke.center');
	const smokeAside = $('.smoke.aside');

	const SPEED = 0.4;

	gsap.set(templarhand, {
		transformOrigin: '0% 50%'
	});
	gsap.to(templarhand, {
		rotation: 3,
		repeat: -1,
		yoyo: true,
		duration: 3,
		ease: 'power1.inOut'
	});
	gsap.set([merchhand, coin], {
		transformOrigin: '90% 5%'
	});
	gsap.to([merchhand, coin], {
		rotation: 5,
		repeat: -1,
		yoyo: true,
		duration: 3,
		ease: 'power1.inOut'
	});

	animteCoinGlow();
	animateClouds();

	document.addEventListener('scroll', () => {

		const scrollTop = document.documentElement.scrollTop;

		if (scrollTop < window.innerHeight) {

			gsap.set(banner, { y: scrollTop * SPEED });

			gsap.set([
				templar,
				templarhand,
				merch,
				merchhand,
				coin
			], { y: -scrollTop * 0.2 });

			gsap.set(clouds1, { y: -scrollTop * 0.025 });
			gsap.set(clouds2, { y: -scrollTop * 0.1 });
			gsap.set(clouds3, { y: scrollTop * 0.2 });

			gsap.set([
				mountains,
				camp,
				town,
				smokeCenter,
				smokeAside
			], { y: scrollTop * 0.1 });

		}

	});

	function animteCoinGlow() {

		gsap.set('.coin .glow', {
			rotate: 40
		});
		gsap.to('.coin .glow', {
			duration: 3,
			x: '350%',
			repeat: -1
		});

		// gsap.set('.coin .glow', {
		// 	rotate: 70
		// });
		// gsap.to('.coin .glow', {
		// 	duration: 3,
		// 	x: '50%',
		// 	y: '15%',
		// 	repeat: -1,
		// 	yoyo: true,
		// 	ease: 'power1.inOut'
		// });

	}
	function animateClouds() {

		gsap.to(clouds3, {
			duration: 10,
			x: '5%',
			autoAlpha: 0,
			repeat: -1,
			ease: 'none'
		});
		gsap.to(clouds2, {
			duration: 40,
			x: '5%',
			autoAlpha: 0,
			repeat: -1,
			ease: 'none'
		});
		gsap.to(clouds1, {
			duration: 20,
			x: '5%',
			autoAlpha: 0,
			repeat: -1,
			ease: 'none'
		});

		const cloned1 = clouds1.cloneNode(true);
		const cloned2 = clouds2.cloneNode(true);
		const cloned3 = clouds3.cloneNode(true);
		clouds1.insertAdjacentElement('afterend', cloned1);
		clouds2.insertAdjacentElement('afterend', cloned2);
		clouds3.insertAdjacentElement('afterend', cloned3);

		gsap.set([cloned1, cloned2, cloned3], {
			x: '-5%',
			autoAlpha: 0
		});

		gsap.to(cloned1, {
			duration: 20,
			x: '0%',
			autoAlpha: 1,
			repeat: -1,
			ease: 'none'
		});
		gsap.to(cloned2, {
			duration: 40,
			x: '0%',
			autoAlpha: 1,
			repeat: -1,
			ease: 'none'
		});
		gsap.to(cloned3, {
			duration: 10,
			x: '0%',
			autoAlpha: 1,
			repeat: -1,
			ease: 'none'
		});

	}

}
function smoothAutoScroll() {

	const items = Array.from($('.main_nav').children);

	items.forEach(item => {
		item.onclick = event => {

			event.preventDefault();

			closeMobileMenu();

			const href = item.firstElementChild.getAttribute('href');

			gsap.to(window, {
				duration: 1.5,
				scrollTo: {
					y: href,
					offsetY: 160
				},
				ease: 'power3.inOut'
			});

		};
	});

	function closeMobileMenu() {
		$('.btn_mob_js').classList.remove('opened');
		$('.nav_holder_js').classList.remove('opened');
	}

}
function enableGalleries() {

	const galleries = $$('.js_posters_gallery');
	galleries.forEach(gallery => new Gallery(gallery));

	function Gallery(root) {

		const TRANSITION = 0.5; // posters swapping speed

		const list = root.querySelector('.slider > ul');
		const posters = Array.from(list.children);
		const description = root.querySelector('.slider_title');

		let previousActivePoster;

		description.style.visibility = 'hidden';

		posters.forEach((poster, i) => {

			poster.onclick = event => {

				event.preventDefault();

				if (poster.classList.contains('active')) return openPopup(poster);

				highlightPoster(poster, i);

			};

		});

		function openPopup(poster) {

			console.log('popup');

		}
		function highlightPoster(activePoster, index) {

			let highlightedPosterExists = false;

			posters.forEach(poster => {
				if (poster.classList.contains('active')) highlightedPosterExists = true;
				if (poster === activePoster) return poster.classList.add('active');
				poster.classList.remove('active');
			});

			swapDescription();
			shiftList();

			previousActivePoster = activePoster;

			function swapDescription() {

				if (highlightedPosterExists) temporarityFixListHeight();

				gsap.to(description, {
					duration: TRANSITION / 4,
					autoAlpha: 0
				});

				gsap.to(description, {
					delay: TRANSITION / 2,
					duration: TRANSITION / 4,
					autoAlpha: 1
				});

			}
			function temporarityFixListHeight() {

				const listHeight = list.getBoundingClientRect().height;

				list.style.height = listHeight + 'px';

				setTimeout(() => {
					list.style.height = 'auto';
				}, TRANSITION * 1000);

			}
			function shiftList() {

				const posterWidth = getPosterWidthWithMargin();

				gsap.to(list, {
				    duration: TRANSITION,
				    x: -posterWidth * index
				});

			}
			function getPosterWidthWithMargin() {

				for (const poster of posters) {

					if (poster !== activePoster &&
					poster !== previousActivePoster) {

						const posterStyles = window.getComputedStyle(poster);
						const margin = posterStyles.getPropertyValue('margin-right');

						return poster.getBoundingClientRect().width + parseInt(margin);

					}

				}

			}

		}

	}

}

function $(selector) {
	return document.querySelector(selector);
}
function $$(selector) {
	return document.querySelectorAll(selector);
}
function easeOutCirc(x) {

	return Math.sqrt(1 - Math.pow(x - 1, 2));

}
function easeOutExpo(x) {

	return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);

}
