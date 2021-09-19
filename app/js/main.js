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

	const content = $('.shadow_box');
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
	const characters = $('.banner_anim .holder_persons');

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
	gsap.set(merchhand, {
		transformOrigin: '90% 5%'
	});
	gsap.to(merchhand, {
		rotation: 5,
		repeat: -1,
		yoyo: true,
		duration: 3,
		ease: 'power1.inOut'
	});

	document.addEventListener('scroll', () => {

		const scrollTop = document.documentElement.scrollTop;

		if (scrollTop < window.innerHeight) {
			banner.style.transform = `translate3D(-50%, ${scrollTop * SPEED}px, 0)`;

			gsap.set(templarhand, {
				y: -scrollTop * 0.2
			});

			templar.style.transform = `translate3D(0, ${-scrollTop * 0.2}px, 0)`;
			templarhand.style.transform = `translate3D(0, ${-scrollTop * 0.2}px, 0)`;

			gsap.set(merchhand, {
				y: -scrollTop * 0.2
			});

			merch.style.transform = `translate3D(0, ${-scrollTop * 0.2}px, 0)`;
			merchhand.style.transform = `translate3D(0, ${-scrollTop * 0.2}px, 0)`;

			camp.style.transform = `translate3D(0, ${-scrollTop * 0}px, 0)`;

			clouds1.style.transform = `translate3D(0, ${-scrollTop * 0.025}px, 0)`;
			clouds2.style.transform = `translate3D(0, ${-scrollTop * 0.1}px, 0)`;
			clouds3.style.transform = `translate3D(0, ${scrollTop * 0.2}px, 0)`;

			mountains.style.transform = `translate3D(0, ${scrollTop * .1}px, 0)`;
			town.style.transform = `translate3D(0, ${scrollTop * .1}px, 0)`;

		}

	});

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
