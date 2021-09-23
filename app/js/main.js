const lbxpAttributes = '[data-lbxp], [data-lbxp-img], [data-lbxp-video], [data-lbxp-html], [data-lbxp-iframe]';
const formats = {
	html: ['.asp', '.aspx', '.htm', '.html', '.htmls', '.jsp', '.php', '.xhtml'],
	video: ['.ogv', '.ogm', '.ogg', '.mp4', '.webm', 'mpeg']
};
const videoServices = {
	'youtube': {
		domains: [/youtube\.com/, /youtu\.be/, /youtube-nocookie\.com/],
		scripts: 'https://www.youtube.com/iframe_api',
		added: false
	},
	'vimeo': {
		domains: [/vimeo\.com/],
		scripts: 'https://player.vimeo.com/api/player.js',
		added: false
	}
};
let videoServicesFound = [];

init();

function init() {
	if (!document.body) {
		document.addEventListener('DOMContentLoaded', function() {
			window.lbxp = new Lbxp();
			window.LiteBoxPro = LiteBoxPro;
		});
	} else {
		window.lbxp = new Lbxp();
		window.LiteBoxPro = LiteBoxPro;
	}
}
function Lbxp() {

	'use strict';
	let targetDOM = document.body;
	let opened = false;
	let previousActive = null;

	// animation timings
	const containerRevealTime = 0.8;

	// video settings
	const videoRatio = 0.5625; // 9:16
	let videoFrame;

	// variables from gallery object
	let styleSettings;
	let active = null;
	let dataArray = [];
	let direction;

	gsap.defaults({
		overwrite: 'auto'
	});
	gsap.config({
		force3D: true
	});

	const mainEl = addMainDOM();

	const page = new Page();
	const back = new Background();
	// UI components
	const container = new Container();
	const pager = new Pager();
	const arrows = new Arrows();
	const closer = new CloseBtn();
	const preloader = new Preloader();
	// other UI
	new TouchGestures();
	new KeyboardControls();
	new PreventScrollOnOpen();

	// methods
	this.is_opened = getState;
	this.open = open;
	this.close = close;
	this.active = active;
	this.hey = hey;

	// UI components
	this.elem = mainEl;
	this.media = container;
	this.background = back;
	this.pager = pager;
	this.close_btn = closer;
	this.arrows = arrows;
	this.preloader = preloader;

	safariFullscreenFix();

	function addMainDOM() {

		const elem = document.createElement('div');
		elem.classList.add('lbxp');
		elem.style.cssText =
			'display:block;' +
			'box-sizing:border-box;' +
			'margin:0;' +
			'padding:0;' +
			'width:100%;' +
			'height:100%;' +
			'top:0;' +
			'left:0;' +
			'visibility:hidden;' +
			'position:fixed;';

		targetDOM.insertAdjacentElement('beforeEnd', elem);
		return elem;

	}
	function Page() {

		let pageType = '';

		this.type = pageType;
		this.get_type = getType;

		mainEl.addEventListener('lbxp-opened', watchPageWidth);
		mainEl.addEventListener('lbxp-closed', unwatchPageWidth);

		function watchPageWidth() {
			getType();
			window.addEventListener('resize', watchType);
		}
		function unwatchPageWidth() {
			pageType = '';
			window.removeEventListener('resize', watchType);
		}
		function getType() {

			let breakpointH = parseInt(styleSettings.mobile_width);
			let breakpointV = parseInt(styleSettings.mobile_height);
			let currentWidth = mainEl.clientWidth;
			let currentHeight = mainEl.clientHeight;

			if (currentWidth <= breakpointH || currentHeight <= breakpointV) {
				pageType = 'mobile';
			} else {
				pageType = 'default';
			}

			return pageType;

		}
		function watchType() {

			let breakpointH = parseInt(styleSettings.mobile_width);
			let breakpointV = parseInt(styleSettings.mobile_height);
			let currentWidth = mainEl.clientWidth;
			let currentHeight = mainEl.clientHeight;

			if ((currentWidth <= breakpointH || currentHeight <= breakpointV) && pageType === 'default') {
				pageType = 'mobile';
				hey('lbxp-breakpoint', pageType);
			} else if ((currentWidth > breakpointH && currentHeight > breakpointV) && pageType === 'mobile') {
				pageType = 'default';
				hey('lbxp-breakpoint', pageType);
			}

		}

	}
	// UI components
	function Container() {

		let elem;
		let media;
		let currentStyle;
		let swiped = false;
		const xhr = new XMLHttpRequest();
		const dragBounds = {
			left: null,
			width: null
		};

		addElementDOM();

		let style = new Styles();

		mainEl.addEventListener('lbxp-breakpoint', handleBreakpoint);
		mainEl.addEventListener('lbxp-opened', generateMedia);
		mainEl.addEventListener('lbxp-swap-media', handleSwap);
		mainEl.addEventListener('lbxp-closed', hide);

		elem.onclick = event => {
			if (event.target.tagName !== 'IMG') close();
		}

		let self = this;
		this.elem = elem;
		this.style = style;
		this.swiped = swiped;
		this.reveal_opened = revealOpened;
		this.reveal_swapped = revealSwapped;
		this.hide = hide;

		function addElementDOM() {
			elem = document.createElement('div');
			elem.style.cssText = getDefaultStyle();
			mainEl.insertAdjacentElement('beforeend', elem);
		}
		function Styles() {

			this.switch = switchStyles;
			this.update = updateStyles;
			this.corner_radius = setCornerRadius;
			this.margin = setMargin;

			function switchStyles(pageType) {
				if (!pageType) {
					pageType = page.get_type();
				}
				currentStyle = styleSettings.media[pageType];
			}
			function updateStyles() {
				setCornerRadius(currentStyle.corner_radius);
				setMargin(currentStyle.margin);
			}

			function setCornerRadius(value) {

				if (opened && media) {

					const v = parseValue(value);
					value = v.num + v.uni;

					media.style.borderRadius = value;
					media.style.overflow = 'hidden';

				}

			}
			function setMargin(margin) {

				if (opened) {

					let top = parseValue(margin.top);
					let left = parseValue(margin.left);
					let bottom = parseValue(margin.bottom);
					let right = parseValue(margin.right);

					elem.style.top = top.num + top.uni;
					elem.style.left = left.num + left.uni;
					elem.style.height = 'calc(100% - (' + top.num + top.uni + ' + ' + bottom.num + bottom.uni + '))';
					elem.style.width = 'calc(100% - (' + left.num + left.uni + ' + ' + right.num + right.uni + '))';

				}

			}

		}
		function handleBreakpoint(e) {
			let pageType = e.detail;
			style.switch(pageType);
			style.update();
			updateDragBounds(currentStyle.margin);
		}
		function generateMedia() {

			elem.innerHTML = '';
			style.switch();
			style.update();

			switch (dataArray[active].type) {
				case 'image':
					createImageElement();
					loaData(dataArray[active].source, 'arraybuffer', processMedia);
					break;
				case 'video':
					createVideoElement(dataArray[active]);
					break;
				case 'html':
					createHTMLElement();
					loaData(dataArray[active].source, 'text', embedHTML);
					break;
				case 'iframe':
					createIframeElement();
					loaData(dataArray[active].source, 'document', embedIframe);
					break;
				default:
					break;
			}

			window.addEventListener('resize', onResize);

			function createImageElement() {
				media = new Image();
				media.style.cssText =
					getDefaultStyle() +
					'width:auto;' +
					'height:auto;' +
					'max-width:100%;' +
					'max-height:100%;' +
					'object-fit:contain;' +
					'transform:translate(-50%,-50%);' +
					'top:50%;' +
					'left:50%';

				elem.appendChild(media);
			}
			function createVideoElement(item) {

				const frame = getVideoFrameDimensions();
				const containerObserver = new MutationObserver(afterIframeAdded);

				media = createVideoBG();
				style.corner_radius(currentStyle.corner_radius);
				containerObserver.observe(elem, { childList: true, subtree: true });

				switch (item.video_hosting) {
					case 'local':
						addVideoElement(dataArray[active]);
						break;
					case 'youtube':
						initYoutubePlayer(dataArray[active].video_id, media);
						break;
					case 'vimeo':
						initVimeoPlayer(dataArray[active].source[0], media);
						break;
					default:
						break;
				}

				revealMedia();

				mainEl.addEventListener('lbxp-swap-media', stopUpdatingIframeSize);
				mainEl.addEventListener('lbxp-closed', stopUpdatingIframeSize);

				function createVideoBG() {
					const div = document.createElement('div');
					div.style.cssText =
						getIframeCSS() +
						'width:' + frame.width + 'px;' +
						'height:' + frame.height + 'px;';
					elem.appendChild(div);
					return div;
				}
				function updateIframeDimensions() {

					const iframe = getVideoFrameDimensions();

					if (item.video_hosting === 'vimeo') {
						media.style.width = iframe.width + 'px';
						media.style.height = iframe.height + 'px';
						media.firstElementChild.setAttribute('width', iframe.width);
						media.firstElementChild.setAttribute('height', iframe.height);
						return;
					} else if (item.video_hosting === 'local') {
						media.style.width = iframe.width + 'px';
						media.style.height = iframe.height + 'px';
						return;
					}

					media.setAttribute('width', iframe.width);
					media.setAttribute('height', iframe.height);

				}
				function stopUpdatingIframeSize() {
					window.removeEventListener('resize', updateIframeDimensions);
				}

				function addVideoElement(item) {
					const video = document.createElement('video');
					video.style.cssText =
						getIframeCSS() +
						'width:' + frame.width + 'px;' +
						'height:' + frame.height + 'px;';

					addAttributes();

					let sources = '';
					item.source.forEach(generateSourceTag);

					video.innerHTML = sources;
					elem.insertAdjacentElement('afterbegin', video);

					function addAttributes() {
						const attributes = Object.keys(styleSettings.video);
						attributes.forEach(function(key) {
							video[key] = styleSettings.video[key];
						});
						if (item.poster) video.poster = item.poster;
					}
					function generateSourceTag(url) {
						const extension = getExtension(url);
						let type = 'video/' + extension.substring(1);
						if (extension === '.ogv' || extension === '.ogm' || extension === '.ogg') {
							type = 'video/ogg';
						}
						sources += '<source src="' + url + '" type="' + type + '">';
					}
				}
				function initYoutubePlayer(id, object) {
					self.video = new YT.Player(object, {
						videoId: id,
						width: frame.width + '',
						height: frame.height + '',
						events: {
							'onReady': onPlayerReady
						}
					});
				}
				function initVimeoPlayer(url, object) {

					const frame = getVideoFrameDimensions();

					self.video = new Vimeo.Player(object, {
						url: url,
						width: frame.width,
						height: frame.height
					});
					self.video.on('loaded', onPlayerReady);

				}
				function afterIframeAdded(mutationsList, observer) {
					const addedNodes = mutationsList[0].addedNodes;
					const host = item.video_hosting;
					if (addedNodes.length > 0) {
						if (host === 'youtube') {
							media = addedNodes[0];
						} else if (host === 'local') {
							elem.removeChild(media);
							media = addedNodes[0];
						}
						media.style.cssText = getIframeCSS();
						if (host === 'local') {
							media.style.width = frame.width + 'px';
							media.style.height = frame.height + 'px';
						}
						style.corner_radius(currentStyle.corner_radius);
						window.addEventListener('resize', updateIframeDimensions);
						observer.disconnect();
					}
				}
				function onPlayerReady() {
					if (styleSettings.video.autoplay) {
						if (item.video_hosting === 'vimeo') return self.video.play();
						self.video.playVideo();
					}
					if (styleSettings.video.muted) {
						if (item.video_hosting === 'vimeo') return self.video.setVolume(0);
						self.video.mute();
					}
				}

			}
			function createHTMLElement() {
				self.html = media = document.createElement('div');
				media.style.cssText =
					getDefaultStyle() +
					'width:100%;' +
					'height:100%;' +
					'display:flex;' +
					'overflow:hidden;' +
					'border-radius:' + currentStyle.corner_radius + ';';
				elem.appendChild(media);
			}
			function createIframeElement() {
				self.iframe = media = document.createElement('iframe');
				media.style.cssText =
					getDefaultStyle() +
					'border:0;' +
					'width:100%;' +
					'height:100%;' +
					'overflow:hidden;' +
					'border-radius:' + currentStyle.corner_radius + ';';
				elem.appendChild(media);
			}

			function loaData(url, responseType, callback) {

				let dataType;

				if (window.location.protocol === 'file:' || responseType === 'document') {
					if (responseType === 'text') {
						const info = 'https://wikipedia.org/wiki/JavaScript#Security';
						console.error('liteBox.pro:\n' +
							'Direct reading files in the local file system is forbidden: ' + info + '\n' +
							'Use %cdata-lbxp-iframe%c attribute instead.',
							'color:#000;background:#ffd4a2;border-radius:4px;padding:2px 6px',
							'all:unset');
						showError();
						return revealMedia();
					}
					dataType = 'local';
					return callback(url, dataType);
				}

				let loadCheck = false;
				let loaded;

				xhr.open("GET", url, true);
				xhr.responseType = responseType;
				xhr.onprogress = function(e) {

					loaded = e.loaded / e.total;

					if (!loadCheck) {
						setTimeout(showLoader, 100); // show preloader in 100 ms
					} else {
						preloader.animate(loaded);
					}

				};
				xhr.onreadystatechange = function() {
					if (this.readyState === 4) {
						if (this.status === 200 || this.statusText === 'OK') {
							dataType = 'blob';
						} else {
							dataType = 'error';
						}
						callback(this.response, dataType);
					}
				};
				xhr.send();

				function showLoader() {
					if (loaded < 1) { // if image not loaded
						if (!loadCheck) {
							preloader.show(); // reveal preloader
						}
						preloader.animate(loaded);
					}
					loadCheck = true;
				}

			}
			function processMedia(data, type) {

				switch (type) {
					case 'blob':
						drawImage(data);
						break;
					case 'local':
						embedSrc(data);
						break;
					case 'error':
						showError();
						break;
					default:
						break;
				}

				revealMedia();

				function drawImage(dat) {

					let arrayBufferView = new Uint8Array(dat);
					let blob = new Blob([arrayBufferView], {
						type: "image/jpeg"
					});
					let urlCreator = window.URL || window.webkitURL;
					let file = urlCreator.createObjectURL(blob);
					embedSrc(file);

				}
				function embedSrc(url) {
					media.src = url;
					media.onerror = showError;
				}

			}
			function embedHTML(dat) {
				media.innerHTML = dat;
				hey('lbxp-html-loaded');
				revealMedia();
			}
			function embedIframe(url) {
				media.src = url;
				media.onload = function() {
					hey('lbxp-iframe-loaded');
				}
				revealMedia();
			}

		}
		function handleSwap() {


			xhr.abort();
			preloader.abort();
			hideMedia(direction, self.swiped);

			function hideMedia(direction, swiped) {

				if (swiped) {

					generateMedia();
					swiped = false;

				} else {

					const shift = elem.clientWidth;

					gsap.to(elem, {
						duration: 0.3,
						x: direction * shift,
						autoAlpha: 0,
						ease: 'power4.in',
						onComplete: generateMedia
					});

				}

			}

		}
		function revealMedia() {

			if (direction === false) {
				revealOpened();
			} else {
				revealSwapped(direction);
			}

			hey('lbxp-media-reveal');

		}
		function updateDragBounds(margin) {

			if (active > 0 && active < dataArray.length - 1) {
				dragBounds.left = -window.innerWidth;
				dragBounds.width = window.innerWidth * 3;
				return;
			}

			let leftMarginUnits = gsap.utils.getUnit(margin.left);
			let leftMarginWidth;

			switch (leftMarginUnits) {
				case '%':
					const percents = parseFloat(currentStyle.margin.left);
					leftMarginWidth = Math.round(percents / 100 * window.innerWidth);
					break;
				case 'px':
					leftMarginWidth = parseFloat(currentStyle.margin.left);
					break;
				default:
					leftMarginWidth = currentStyle.margin.left;
					break;
			}

			if (active === 0) {
				dragBounds.left = -window.innerWidth;
				dragBounds.width = window.innerWidth + leftMarginWidth + gsap.getProperty(elem, 'width');
			} else if (active === dataArray.length - 1) {
				dragBounds.left = 0;
				dragBounds.width = leftMarginWidth + window.innerWidth * 2;
			}

		}
		function onResize() {
			updateDragBounds(currentStyle.margin);
		}
		function revealOpened() {

			const delay = 0.2;
			let mediaType = dataArray[active].type;
			if (mediaType === 'video') {
				gsap.set(media, {
					autoAlpha: 0
				});
			}
			gsap.set(elem, {
				x: 0,
				y: 0,
				autoAlpha: 0,
				scale: 0.9
			});
			gsap.to(elem, {
				duration: containerRevealTime / 2,
				autoAlpha: 1,
				delay: delay,
				ease: 'power2.in'
			});
			gsap.to(elem, {
				duration: containerRevealTime,
				scale: 1,
				delay: delay,
				ease: 'power2'
			});
			if (mediaType === 'video' || mediaType === 'html') {
				gsap.to(media, {
					duration: containerRevealTime,
					autoAlpha: 1,
					delay: delay,
					ease: 'power2.in'
				});
			}

		}
		function revealSwapped(direction) {

			gsap.set(elem, {
				x: -direction * elem.clientWidth,
				delay: 0.01
			});
			gsap.to(elem, {
				duration: 0.5,
				delay: 0.05,
				x: 0,
				autoAlpha: 1,
				ease: 'power3'
			});

		}
		function hide() {

			window.removeEventListener('resize', onResize);

			if (self.swiped) {
				gsap.set(elem, {
					autoAlpha: 0
				});
				wipeOut();
			} else {
				gsap.to(elem, {
					duration: 0.3,
					autoAlpha: 0,
					scale: 0.9,
					ease: 'power4.in',
					onComplete: wipeOut
				});
			}

			function wipeOut() {
				elem.innerHTML = '';
			}

		}
		function showError() {

			const errorImg = '<div style="position: absolute; transform: translate(-50%, -50%); display: block; top: 50%; left: 50%; width: 100%; height: 100%; background-color: #0B121A; opacity: 0.9; border-radius: 3px;">' +
				'</div>' +
				'<svg id="lbxp-404" width="64" height="64" viewbox="0 0 100 100" version="1.1" ' +
				'style="' +
				getDefaultStyle() +
				'top:50%;' +
				'left:50%;' +
				'transform:translate(-50%,-50%);' +
				'">' +
				'<style>.lbxp-404-str {opacity: 0.25;stroke-width: 3;stroke: #FFF;}</style>' +
				'<circle class="lbxp-404-str" id="" cx="50" cy="50" r="48" fill="transparent" />' +
				'<line class="lbxp-404-str" x1="30" y1="70" x2="70" y2="30" />' +
				'<line class="lbxp-404-str" x1="30" y1="30" x2="70" y2="70" />' +
				'</svg>';

			elem.innerHTML = errorImg;

		}

	}
	function Background() {

		let elem;
		let currentStyle;

		addElementDOM();

		let style = new Styles();

		mainEl.addEventListener('lbxp-breakpoint', handleBreakpoint);
		mainEl.addEventListener('lbxp-opened', show);
		mainEl.addEventListener('lbxp-closed', hide);

		this.elem = elem;
		this.style = style;
		this.show = show;
		this.hide = hide;

		elem.onclick = close;

		function addElementDOM() {
			elem = document.createElement('div');
			elem.style.cssText = getDefaultStyle() + 'width:100%;height:100%;top:0;left:0;visibility:hidden;'
			mainEl.insertAdjacentElement('afterbegin', elem);
		}
		function Styles() {

			this.switch = switchStyles;
			this.update = updateStyles;

			this.color = setColor;
			this.hide = setVisibility;
			this.opacity = setOpacity;

			function switchStyles(pageType) {
				if (!pageType) {
					pageType = page.get_type();
				}
				currentStyle = styleSettings.background[pageType];
			}
			function updateStyles() {

				setColor(currentStyle.color);
				setVisibility(currentStyle.hide);
				setOpacity(currentStyle.opacity)

			}

			function setColor(value) {
				if (opened) elem.style.backgroundColor = value;
			}
			function setVisibility(hidden) {

				let visibility = 1;

				if (hidden) {
					visibility = 0;
				}

				gsap.set(elem, { autoAlpha: visibility });

			}
			function setOpacity(value) {

				if (opened && !currentStyle.hide) {
					value = parseFloat(value);
					gsap.to(elem, {
						duration: 0.1,
						autoAlpha: value
					});
				}

			}

		}
		function handleBreakpoint(e) {
			let pageType = e.detail;
			style.switch(pageType);
			style.update();
		}
		function show() {

			style.switch();
			style.update();

			if (!currentStyle.hide) {
				const value = parseValue(currentStyle.opacity).num;
				elem.style.opacity = 0;
				gsap.to(elem, {
					duration: 0.4,
					autoAlpha: value
				});
			}

		}
		function hide() {

			gsap.to(elem, {
				duration: 0.6,
				autoAlpha: 0,
				onComplete: function() {
					gsap.set(mainEl, {
						autoAlpha: 0
					});
				}
			});

		}

	}
	function Pager() {

		// elements
		let elem;
		let pagerDefault; // <ul>
		let pagerCompact;
		let pagerCompactBg;
		let pagerCompactDot;

		let currentStyle;
		let look = null;
		let lookBreakpoint;

		addElementDOM();
		hidePager();

		let pagerLook = new PagerLookSwitch();
		let style = new Styles();

		mainEl.addEventListener('lbxp-breakpoint', handleBreakpoint);
		mainEl.addEventListener('lbxp-opened', generate);
		mainEl.addEventListener('lbxp-closed', hide);
		mainEl.addEventListener('lbxp-swap-media', handleChange);

		this.elem = elem;
		this.style = style;
		this.generate = generate;
		this.hide = hide;
		this.show = show;
		this.show_active = showActive;

		function addElementDOM() {

			elem = document.createElement('div');
			elem.style.cssText = getDefaultStyle();

			pagerDefault = document.createElement('ul');
			pagerDefault.style.cssText = getDefaultStyle() + 'width: auto;position: relative;display: inline-flex';
			elem.insertAdjacentElement('beforeend', pagerDefault);

			pagerCompact = document.createElement('div');
			pagerCompact.style.cssText = getDefaultStyle() + 'position:absolute;top:50%;left:0;width:100%;height:100%;cursor:pointer';
			elem.insertAdjacentElement('beforeend', pagerCompact);

			pagerCompactBg = document.createElement('div');
			pagerCompactBg.style.cssText = getDefaultStyle() + 'top:0;left:50%;visibility:hidden;opacity:0;transform:translate(-50%,-50%)';

			pagerCompact.insertAdjacentElement('beforeend', pagerCompactBg);

			pagerCompactDot = document.createElement('div');
			pagerCompactDot.style.cssText = getDefaultStyle() + 'visibility:hidden;opacity:0';
			pagerCompact.insertAdjacentElement('beforeend', pagerCompactDot);

			mainEl.insertAdjacentElement('beforeEnd', elem);

		}
		function hidePager() {

			pagerCompactDot.style.cssText = getDefaultStyle() + 'transform:translate(-50%,-50%)';

			gsap.set([pagerDefault, pagerCompact], {
				autoAlpha: 0
			});

		}
		function Styles() {

			this.switch = switchStyles;
			this.update = updateStyles;

			this.color = setColor;
			this.hide = setVisibility;
			this.img_width = setImgWidth;
			this.img_height = setImgHeight;
			this.click_width = setClickWidth;
			this.click_height = setClickHeight;
			this.gap = setGap;
			this.position = setComponentPosition;
			this.max_width = setMaxWidth;
			this.inactive_opacity = setInactiveOpacity;

			function switchStyles(pageType) {
				if (!pageType) {
					pageType = page.get_type();
				}
				currentStyle = styleSettings.pager[pageType];
			}
			function updateStyles() {

				setColor(styleSettings.theme_color);
				setVisibility(currentStyle.hide);
				setImgWidth(currentStyle.img_width);
				setImgHeight(currentStyle.img_height);
				setClickWidth(currentStyle.click_width);
				setClickHeight(currentStyle.click_height);
				setGap(currentStyle.gap);
				setInactiveOpacity(currentStyle.inactive_opacity);
				setMaxWidth(currentStyle.max_width);
				setComponentPosition(currentStyle.position, elem);

			}

			function setColor(value) {

				if (opened && dataArray.length > 1) {
					const dots = pagerDefault.children;
					for (let i = 0; i < dots.length; i++) {
						let circle = dots[i].firstElementChild.firstElementChild;
						circle.setAttribute('fill', value);
					}
					pagerCompactBg.style.backgroundColor = value;
					pagerCompactDot.style.backgroundColor = value;
				}

			}
			function setVisibility(hidden) {

				let visibility = 1;

				if (hidden) {
					visibility = 0;
				}

				gsap.set(elem, {
					autoAlpha: visibility
				});

			}
			function setImgWidth(value) {

				if (opened) {

					value = parseValue(value).num; // px only

					const dots = pagerDefault.children;
					for (let i = 0; i < dots.length; i++) {
						dots[i].firstElementChild.setAttribute('width', value);
					}

					const clickWidth = parseFloat(currentStyle.click_width);
					pagerCompactBg.style.width = 'calc(100% - ' + (clickWidth - value) + 'px)';

				}

			}
			function setImgHeight(value) {

				if (opened) {

					value = parseValue(value).num; // px only

					const dots = pagerDefault.children;
					for (let i = 0; i < dots.length; i++) {
						dots[i].firstElementChild.setAttribute('height', value);
					}

					pagerCompactBg.style.height = value + 'px';
					pagerCompactBg.style.borderRadius = value / 2 + 'px';
					pagerCompactDot.style.width = value + 'px';
					pagerCompactDot.style.height = value + 'px';

				}

			}
			function setClickWidth(value) {

				if (opened) {

					value = parseValue(value).num; // px only

					const dots = pagerDefault.children;
					for (let i = 0; i < dots.length; i++) {
						dots[i].style.width = value + 'px';
					}

					const imgWidth = parseInt(currentStyle.img_width);
					pagerCompactBg.style.width = 'calc(100% - ' + (value - imgWidth) + 'px)';

				}

			}
			function setClickHeight(value) {

				if (opened) {

					value = parseValue(value).num;

					const dots = pagerDefault.children;
					for (let i = 0; i < dots.length; i++) {
						dots[i].style.height = value + 'px';
					}

				}

			}
			function setGap(value) {

				if (opened) {
					value = parseValue(value).num;
					const dots = pagerDefault.children;
					for (let i = 0; i < dots.length; i++) {
						dots[i].style.marginRight = value + 'px';
					}
					setMaxWidth(currentStyle.max_width);
				}

			}
			function setMaxWidth(value) {

				if (opened) {

					value = parseValue(value);
					const liWidth = parseValue(currentStyle.click_width).num;
					const liGap = parseValue(currentStyle.gap).num;

					const totalPagerWidth = dataArray.length * (liWidth + liGap);
					const SIDE_MARGINS = 40 * 2; // left and right margins (from the page edge)

					if (value.uni === '%') {

						elem.style.maxWidth = value.num + '%';
						lookBreakpoint = totalPagerWidth * 100 / value.num;

					} else {

						if (value.num > totalPagerWidth) {

							elem.style.width = '';
							elem.style.maxWidth = value.num + 'px';
							lookBreakpoint = totalPagerWidth + SIDE_MARGINS;

						} else {

							elem.style.maxWidth = value.num + 'px';
							elem.style.width = 'calc(100% - ' + SIDE_MARGINS + 'px)';
							lookBreakpoint = 10000;

						}

					}

					const look = pagerLook.type(lookBreakpoint);
					switchCompact(look);

				}

			}
			function setInactiveOpacity(value) {

				if (opened && dataArray.length > 1) {
					value = parseValue(value).num;
					for (let i = 0; i < dataArray.length; i++) {
						if (i !== active) {
							const dot = pagerDefault.children[i].firstElementChild.firstElementChild;
							dot.setAttribute('fill-opacity', value);
						}
					}
					pagerCompactBg.style.opacity = value;
				}

			}

		}
		function generate() {

			if (dataArray.length > 1) {

				createDefault();
				createCompact();
				style.switch();
				style.update();
				showActive(active);

				if (dataArray.length > 1) {
					setTimeout(show, containerRevealTime * 1000);
				}

			}

			function createDefault() {

				const clickWidth = parseValue(styleSettings.click_width).num;
				const clickHeight = parseValue(styleSettings.click_height).num;
				const gap = parseValue(styleSettings.gap).num;

				let dot = '';
				const inactiveOpacity = parseValue(styleSettings.inactive_opacity).num;
				const activeOpacity = 1;

				for (let i = 0; i < dataArray.length; i++) {
					if (i === active) {
						addDot(i, activeOpacity);
						continue;
					}
					addDot(i, inactiveOpacity);
				}

				pagerDefault.insertAdjacentHTML('beforeEnd', dot);

				function addDot(i, opacity) {

					dot +=
						'<li data-lbxp-n="' + i + '" style="' + getDefaultStyle() + 'visibility:hidden;opacity:0;position:relative;float:left;cursor:pointer;' +
						'width:' + clickWidth + 'px;' +
						'height:' + clickHeight + 'px;' +
						'margin-right:' + gap + 'px;">' +
						'<svg xmlns="http://www.w3.org/2000/svg" ' +
						'style="' + getDefaultStyle() + 'top:50%;left:50%;transform:translate(-50%,-50%)" ' +
						'viewBox="0 0 2 2">' +
						'<circle cx="1" cy="1" r="1" ' +
						'fill="' + styleSettings.theme_color + '" ' +
						'fill-opacity="' + opacity +
						'"/>' +
						'</svg>' +
						'</li>';

				}

			}
			function createCompact() {
				pagerCompactDot.style.borderRadius = '50%';
			}

		}
		function show() {

			if (look === 'default') {
				gsap.set(pagerDefault, {
					autoAlpha: 1
				});
				gsap.set(pagerCompact, {
					autoAlpha: 0
				});
			} else {
				gsap.set(pagerDefault, {
					autoAlpha: 0
				});
				gsap.set(pagerCompact, {
					autoAlpha: 1
				});
			}

			let step = 0.6 / pagerDefault.children.length;
			gsap.to(pagerDefault.children, {
				duration: 0.4,
				autoAlpha: 1,
				stagger: step
			});
			gsap.set(pagerCompactBg, {
				scaleX: 0,
				autoAlpha: currentStyle.inactive_opacity / 3
			});
			gsap.to(pagerCompactBg, {
				duration: 0.6,
				scale: 1,
				ease: 'power3.inOut'
			});
			gsap.to(pagerCompactDot, {
				duration: 0.3,
				autoAlpha: 1,
				delay: 0.5
			});

			applyClicks();

		}
		function hide() {

			let pagerElements = [pagerDefault, pagerCompact, pagerCompactDot, pagerCompactBg];
			gsap.to(pagerElements, {
				duration: 0.3,
				autoAlpha: 0,
				onComplete: function() {
					pagerDefault.innerHTML = '';
				}
			});

			mainEl.removeEventListener('pagerScreenWidth', switchCompact);

		}
		function applyClicks() {

			elem.onclick = function(e) {
				let t = e.target;
				while (t !== this) {
					if (t.tagName === 'LI') {
						open(t.dataset.lbxpN);
					} else if (t === pagerCompactDot) {
						return;
					} else if (t === pagerCompact) {
						let n = detectN();
						if (n !== active) {
							open(n);
						}
					}
					t = t.parentNode;
				};

				function detectN() {

					return Math.floor(e.offsetX / (e.target.clientWidth / dataArray.length));

				}

			}

		}
		function showActive(n) {

			if (!n) {
				n = active;
			}

			const pagerWidth = pagerCompact.clientWidth;
			const liWidth = parseValue(currentStyle.click_width).num;
			const barWidth = pagerWidth - liWidth;
			const step = barWidth / (dataArray.length - 1);
			const position = step * n;
			const percents = (position + liWidth / 2) / pagerWidth * 100;

			if (previousActive !== null) dotOpacity(previousActive, currentStyle.inactive_opacity);

			dotOpacity(n, 1);

			gsap.to(pagerCompactDot, {
				duration: 0.5,
				'left': percents + '%',
				ease: 'power1.inOut'
			});

			function dotOpacity(i, opacity) {
				const dot = pagerDefault.children[i].firstElementChild.firstElementChild;
				dot.setAttribute('fill-opacity', opacity);
			}

		}
		function handleBreakpoint(e) {
			let pageType = e.detail;
			style.switch(pageType);
			style.update();
		}
		function PagerLookSwitch() {

			this.type = getLook;
			this.update_width = watchPageWidth;

			mainEl.addEventListener('lbxp-opened', watchPageWidth);
			mainEl.addEventListener('lbxp-closed', unwatchPageWidth);

			function watchPageWidth() {
				window.addEventListener('resize', watchWidth);
			}
			function unwatchPageWidth() {
				window.removeEventListener('resize', watchWidth);
			}
			function getLook(width) {

				if (targetDOM.clientWidth > width) {
					look = 'default';
				} else {
					look = 'compact';
				}

				return look;

			}
			function watchWidth() {

				if (targetDOM.clientWidth > lookBreakpoint && look === 'compact') {
					look = 'default';
					switchCompact(look);
				} else if (targetDOM.clientWidth < lookBreakpoint && look === 'default') {
					look = 'compact';
					switchCompact(look);
				}

			}

		}
		function handleChange(e) {
			showActive(e.detail);
		}
		function switchCompact(look) {

			if (look === 'compact') {

				gsap.to(pagerDefault, {
					duration: 0.2,
					autoAlpha: 0
				});
				gsap.to(pagerCompact, {
					duration: 0.2,
					autoAlpha: 1,
					delay: 0.2
				});

			} else {

				gsap.to(pagerDefault, {
					duration: 0.2,
					autoAlpha: 1,
					delay: 0.2
				});
				gsap.to(pagerCompact, {
					duration: 0.2,
					autoAlpha: 0
				});

			}

		}

	}
	function Arrows() {

		let left;
		let right;
		let svgPathLeft;
		let svgPathRight;
		let currentStyle;

		addElementDOM();

		let style = new Styles();

		mainEl.addEventListener('lbxp-breakpoint', handleBreakpoint);
		mainEl.addEventListener('lbxp-opened', show);
		mainEl.addEventListener('lbxp-closed', hide);
		mainEl.addEventListener('lbxp-swap-media', handleArrowsActivity);

		this.left = left;
		this.right = right;
		this.style = style;
		this.hide = hide;
		this.show = show;

		function addElementDOM() {

			const svgFill = 'transparent';
			const strokeWidth = 3;
			const basicStyle = getDefaultStyle() + 'border:0;background:0 0;cursor:pointer;outline:0';
			const svgTag = '<svg xmlns: xlink="http://www.w3.org/1999/xlink" ' +
				'style="' +
				getDefaultStyle() +
				'left:50%;' +
				'top:50%;' +
				'transform:translate(-50%,-50%)' +
				'" viewBox="0 0 50 80">' +
				'</svg>';

			left = document.createElement('button');
			left.innerHTML = svgTag;
			right = document.createElement('button');
			right.innerHTML = svgTag;
			left.style.cssText = right.style.cssText = basicStyle;

			svgPathLeft = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			svgPathLeft.setAttribute('fill', svgFill);
			svgPathLeft.setAttribute('stroke-width', strokeWidth);
			svgPathLeft.setAttribute('d', 'M 39 10 L 13 40 L 39 70');

			svgPathRight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			svgPathRight.setAttribute('fill', svgFill);
			svgPathRight.setAttribute('stroke-width', strokeWidth);
			svgPathRight.setAttribute('d', 'M 13 10 L 39 40 L 13 70');

			left.firstElementChild.appendChild(svgPathLeft);
			right.firstElementChild.appendChild(svgPathRight);

			mainEl.insertAdjacentElement('beforeend', left);
			mainEl.insertAdjacentElement('beforeend', right);

		}
		function Styles() {

			this.switch = switchStyles;
			this.update = updateStyles;

			this.color = setColor;
			this.hide = setVisibility;
			this.img_width = setImgWidth;
			this.img_height = setImgHeight;
			this.click_width = setClickWidth;
			this.click_height = setClickHeight;
			this.inactive_opacity = setInactiveOpacity;
			this.position = setComponentPosition;
			this.line_width = setLineWidth;

			function switchStyles(pageType) {
				if (!pageType) {
					pageType = page.get_type();
				}
				currentStyle = styleSettings.arrows[pageType];
			}
			function updateStyles() {

				setColor(styleSettings.theme_color);
				setVisibility(currentStyle.hide);
				setImgWidth(currentStyle.img_width);
				setImgHeight(currentStyle.img_height);
				setClickWidth(currentStyle.click_width);
				setClickHeight(currentStyle.click_height);
				setInactiveOpacity(currentStyle.inactive_opacity);
				setComponentPosition(currentStyle.position_left, left);
				setComponentPosition(currentStyle.position_right, right);
				setLineWidth(styleSettings.line_width);

			}

			function setColor(value) {
				svgPathLeft.setAttribute('stroke', value);
				svgPathRight.setAttribute('stroke', value);
			}
			function setVisibility(hidden) {

				if (opened) {
					let visibility = 1;

					if (hidden) {
						visibility = 0;
					}

					gsap.set([left, right], {
						autoAlpha: visibility
					});
				}

			}
			function setImgWidth(value) {

				if (opened) {

					value = parseValue(value);
					const leftSVG = left.firstElementChild;
					const rightSVG = right.firstElementChild;

					leftSVG.setAttribute('width', value.num + value.uni);
					rightSVG.setAttribute('width', value.num + value.uni);

				}

			}
			function setImgHeight(value) {

				if (opened) {

					value = parseValue(value);
					const leftSVG = left.firstElementChild;
					const rightSVG = right.firstElementChild;

					leftSVG.setAttribute('height', value.num + value.uni);
					rightSVG.setAttribute('height', value.num + value.uni);

				}

			}
			function setClickWidth(value) {

				if (opened) {

					value = parseValue(value);
					value = value.num + value.uni;
					left.style.width = right.style.width = value;

				}

			}
			function setClickHeight(value) {

				if (opened) {

					value = parseValue(value);
					value = value.num + value.uni;
					left.style.height = right.style.height = value;

				}

			}
			function setInactiveOpacity(value) {

				if (opened && dataArray.length > 1) {

					value = parseValue(value).num;

					if (active === 0) {
						setOpacity(svgPathLeft, value);
						setOpacity(svgPathRight, 1);
					} else if (active === dataArray.length - 1) {
						setOpacity(svgPathRight, value);
						setOpacity(svgPathLeft, 1);
					} else {
						setOpacity([svgPathLeft, svgPathRight], 1);
					}

					function setOpacity(element, value) {
						gsap.to(element, {
							duration: 0.25,
							opacity: value
						});
					}

				}

			}
			function setLineWidth(value) {

				if (opened) {
					value = parseValue(value).num;
					svgPathLeft.setAttribute('stroke-width', value);
					svgPathRight.setAttribute('stroke-width', value);
				}

			}

		}
		function handleBreakpoint(e) {
			let pageType = e.detail;
			style.switch(pageType);
			style.update();
		}
		function hide() {

			gsap.to([left, right], {
				duration: 0.3,
				autoAlpha: 0
			});

		}
		function show() {

			if (dataArray.length > 1) {

				solveActivity(active);
				style.switch();
				style.update();

				gsap.set([left, right], {
					autoAlpha: 0
				});

				if (currentStyle.hide === false) {
					gsap.to([left, right], {
						duration: 1,
						autoAlpha: 1,
						delay: containerRevealTime
					});
				}

			}

		}
		function handleArrowsActivity() {
			solveActivity(active);
			style.inactive_opacity(currentStyle.inactive_opacity);
		}
		function solveActivity(n) {

			if (n === 0) {
				disable(left);
			} else {
				enable(left, -1);
			}

			if (n === dataArray.length - 1) {
				disable(right);
			} else {
				enable(right, 1);
			}

			function disable(button) {
				button.style.cursor = 'default';
				button.onclick = '';
			}
			function enable(button, direction) {
				button.style.cursor = 'pointer';
				button.onclick = function() {

					container.swiped = false;
					open(n + direction);

				}
			}

		}

	}
	function CloseBtn() {

		let elem;
		let svgPath;
		let currentStyle;

		addElementDOM();

		let style = new Styles();

		mainEl.addEventListener('lbxp-breakpoint', handleBreakpoint);
		mainEl.addEventListener('lbxp-opened', show);
		mainEl.addEventListener('lbxp-closed', hide);

		elem.onclick = function() {
			container.swiped = false;
			close();
		};

		this.elem = elem;
		this.style = style;
		this.hide = hide;
		this.show = show;

		function addElementDOM() {

			const svgFill = 'transparent';
			const strokeWidth = 3;
			const svg = '<svg xmlns: xlink="http://www.w3.org/1999/xlink" style="' +
				getDefaultStyle() +
				'top:50%;' +
				'left:50%;' +
				'transform:translate(-50%,-50%)" ' +
				'viewBox="0 0 24 24" ' +
				'preserveAspectRatio="none">' +
				'</svg>';
			elem = document.createElement('div');
			elem.style.cssText = getDefaultStyle();
			elem.style.cursor = 'pointer';
			elem.innerHTML = svg;

			svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			svgPath.setAttribute('fill', svgFill);
			svgPath.setAttribute('stroke-width', strokeWidth);
			svgPath.setAttribute('d', 'M1 1l22 22M23 1L1 23');

			elem.firstElementChild.appendChild(svgPath);
			mainEl.insertAdjacentElement('beforeend', elem);

		}
		function Styles() {

			this.switch = switchStyles;
			this.update = updateStyles;

			this.color = setColor;
			this.hide = setVisibility;
			this.img_width = setImgWidth;
			this.img_height = setImgHeight;
			this.click_width = setClickWidth;
			this.click_height = setClickHeight;
			this.position = setComponentPosition;
			this.line_width = setLineWidth;

			function switchStyles(pageType) {
				if (!pageType) {
					pageType = page.get_type();
				}
				currentStyle = styleSettings.close_btn[pageType];
			}
			function updateStyles() {

				setColor(styleSettings.theme_color);
				setVisibility(currentStyle.hide);
				setImgWidth(currentStyle.img_width);
				setImgHeight(currentStyle.img_height);
				setClickWidth(currentStyle.click_width);
				setClickHeight(currentStyle.click_height);
				setComponentPosition(currentStyle.position, elem);
				setLineWidth(styleSettings.line_width);

			}

			function setColor(value) {
				svgPath.setAttribute('stroke', value);
			}
			function setVisibility(hidden) {

				if (opened) {

					let visibility = 1;

					if (hidden) {
						visibility = 0;
					}

					gsap.set(elem, {
						autoAlpha: visibility
					});

				}

			}
			function setImgWidth(value) {

				if (opened) {
					value = parseValue(value);
					const svg = elem.firstElementChild;
					svg.setAttribute('width', value.num + value.uni);
				}

			}
			function setImgHeight(value) {

				if (opened) {
					value = parseValue(value);
					const svg = elem.firstElementChild;
					svg.setAttribute('height', value.num + value.uni);
				}

			}
			function setClickWidth(value) {
				if (opened) {
					value = parseValue(value);
					elem.style.width = value.num + value.uni;
				}
			}
			function setClickHeight(value) {
				if (opened) {
					value = parseValue(value);
					elem.style.height = value.num + value.uni;
				}
			}
			function setLineWidth(value) {
				if (opened) svgPath.setAttribute('stroke-width', parseValue(value).num);
			}

		}
		function handleBreakpoint(e) {
			let pageType = e.detail;
			style.switch(pageType);
			style.update();
		}
		function hide() {

			gsap.to(elem, {
				duration: 0.3,
				autoAlpha: 0
			});

		}
		function show() {

			gsap.set(elem, {
				autoAlpha: 0
			});

			style.switch();
			style.update();

			if (!currentStyle.hide) {
				gsap.to(elem, {
					duration: 1,
					autoAlpha: 1,
					delay: containerRevealTime
				});
			}

		}

	}
	function Preloader() {

		let elem;

		addElementDOM();

		let radius;
		let shown = false;
		const pixelRatio = window.devicePixelRatio;
		const canBG = document.createElement('canvas');
		const can = document.createElement('canvas');
		let ctxA = can.getContext('2d');
		let ctxB = canBG.getContext('2d');
		let currentStyle;

		let bar = {
			degree: 0
		};

		let style = new Styles();

		mainEl.addEventListener('lbxp-opened', drawPreloader);
		mainEl.addEventListener('lbxp-breakpoint', handleBreakpoint);
		// mainEl.addEventListener('lbxp-closed', removePreloader);

		this.elem = elem;
		this.animate = animate;
		this.show = show;
		this.hide = hide;
		this.abort = abort;
		this.shown = shown;
		this.style = style;

		function Styles() {

			can.style.cssText = canBG.style.cssText = getDefaultStyle();

			this.switch = switchStyles;
			this.update = updateStyles;

			this.size = resize;

			function switchStyles(pageType) {
				if (!pageType) {
					pageType = page.get_type();
				}
				currentStyle = styleSettings.preloader[pageType];
			}
			function updateStyles() {
				resize(currentStyle.size);
			}
			function resize(value) {

				value = parseValue(value).num;
				currentStyle.size = value;
				radius = value / 2 - 2;
				can.style.width = can.style.height = canBG.style.width = canBG.style.height = value + 'px';

			}

		}
		function handleBreakpoint(e) {
			const pageType = e.detail;
			style.switch(pageType);
			style.update();
		}
		function drawPreloader() {
			style.switch();
			style.update();
			createDOM(canBG, currentStyle.size);
			createDOM(can, currentStyle.size);
			drawBgLine();
			drawMovingLine();
		}
		function addElementDOM() {
			elem = document.createElement('div');
			elem.style.cssText = getDefaultStyle() + 'top:50%;left:50%;transform:translate(-50%,-50%) rotate(-90deg)';
			mainEl.insertAdjacentElement('beforeend', elem);
		}
		function createDOM(el, size) {

			size = parseValue(size).num;

			el.setAttribute('width', size);
			el.setAttribute('height', size);
			el.style.visibility = 'hidden';
			el.width = el.height = size * pixelRatio;
			el.style.width = el.style.height = size + 'px';
			el.style.transform = 'translate(-50%,-50%)';

		}
		function drawBgLine() {

			ctxB.translate(canBG.width / 2, canBG.height / 2);
			ctxB.scale(pixelRatio, pixelRatio);
			ctxB.beginPath();
			ctxB.arc(0, 0, radius, 0, Math.PI * 2);
			ctxB.lineWidth = parseInt(styleSettings.line_width);
			ctxB.strokeStyle = '#000';
			ctxB.stroke();

		}
		function drawMovingLine() {

			ctxA.translate(can.width / 2, can.height / 2);
			ctxA.scale(pixelRatio, pixelRatio);
			ctxA.lineWidth = parseInt(styleSettings.line_width);

		}
		function animate(float) {

			let duration = 1;
			let hideFunc = null;

			if (float >= 1) {
				duration = 0.2;
				hideFunc = hide;
			}

			gsap.to(bar, {
				duration: duration,
				degree: gsap.utils.interpolate(0, 360, float),
				onUpdate: drawState,
				onComplete: hideFunc
			});

		}
		function show() {

			ctxA.strokeStyle = styleSettings.theme_color;

			preloader.shown = true;

			elem.appendChild(canBG);
			elem.appendChild(can);

			gsap.to([canBG, can], {
				duration: 0.5,
				autoAlpha: 1
			});

		}
		function abort() {

			gsap.to(bar, {
				duration: 0.1,
				degree: 0,
				onUpdate: drawState
			});

		}
		function drawState() {

			ctxA.clearRect(-can.width / 2, -can.height / 2, can.width, can.height);
			ctxA.beginPath();
			ctxA.arc(0, 0, radius, 0, deg(bar.degree));
			ctxA.stroke();

			function deg(degree) {
				return (Math.PI / 180) * degree;
			}

		}
		function hide() {

			gsap.killTweensOf(bar);

			preloader.shown = false;
			gsap.to([canBG, can], {
				duration: 0.2,
				autoAlpha: 0,
				onComplete: function() {
					gsap.set(bar, {
						degree: 0
					});
					elem.innerHTML = '';
				}
			});

		}

	}

	/* ======================== Controllers ======================== */

	function open(n, arr, settings) {

		active = +n;
		direction = getDirection();

		if (!opened) {
			opened = true;

			if (settings) {
				styleSettings = settings;
				moveDOM(mainEl, settings.target);
				changeZindex(settings.z_index);
			}
			if (arr) {
				dataArray = arr;
			}
			page.get_type();
			revealDOM();
			hey('lbxp-opened');
		} else {
			hey('lbxp-swap-media', n);
		}

		previousActive = active;

		function revealDOM() {

			gsap.set(mainEl, {
				autoAlpha: 1
			});

		}

	}
	function close() {

		previousActive = active = null;
		hey('lbxp-closed');

		opened = false;

	}

	/* ======================== Utilities ======================== */

	function getDefaultStyle() {
		const css =
			'display:block;' +
			'box-sizing:border-box;' +
			'position:absolute;' +
			'margin:0;' +
			'padding:0;';
		return css;
	}
	function getIframeCSS() {
		const css =
			getDefaultStyle() +
			'background-color: hsla(212, 40%, 7%, 0.9);' +
			'top:50%;' +
			'left:50%;' +
			'transform:translate(-50%,-50%);';
		return css;
	}
	function getVideoFrameDimensions() {

		const contHeight = container.elem.scrollHeight;
		const contWidth = container.elem.scrollWidth;
		const containerRatio = contHeight / contWidth;

		let w = contHeight / videoRatio,
			h = contHeight;

		if (containerRatio > videoRatio) {
			w = contWidth;
			h = contWidth * videoRatio;
		}

		videoFrame = { width: w, height: h };
		return videoFrame;

	}
	function moveDOM(element, target) {
		if (typeof (target) === 'string') {
			target = document.querySelector(target);
		}
		target.appendChild(element);
		if (target !== document.body) element.style.position = 'absolute';
	}
	function changeZindex(number) {
		mainEl.style.zIndex = number;
	}
	function getDirection() {

		if (previousActive === null) {
			return false;
		} else {
			if (previousActive < active) {
				return -1; // right
			} else if (previousActive > active) {
				return 1; // left
			}
		}

	}
	function hey(evName, evParams) {
		// generate custom event

		let event;

		if (typeof CustomEvent === 'function') { // if not IE
			event = new CustomEvent(evName, evParams);
			mainEl.dispatchEvent(event);
		} else { // if IE
			CustomEvent.prototype = mainEl.Event.prototype;
			mainEl.CustomEvent = CustomEvent;
		}

		function CustomEvent(event, params) {
			params = params || {
				bubbles: false,
				cancelable: false,
				detail: null
			};
			let evt = document.createEvent('CustomEvent');
			evt.initCustomEvent(evName, params.bubbles, params.cancelable, evParams);
			return evt;
		}

	}
	function parseValue(value) {

		if (value === 'auto' || value === '' || value === ' ' || value === null || value === undefined) {
			return {
				num: '',
				uni: 'auto'
			};
		}

		if (typeof (value) === 'number') {
			return {
				num: value,
				uni: 'px'
			};
		}

		const number = parseFloat(value);

		if (isNaN(number)) {
			return {
				num: '',
				uni: 'auto'
			};
		} else {
			let units = value.replace(/[0-9]/g, '');
			if (units === '%') {
				units = '%';
			} else {
				units = 'px';
			}
			return {
				num: number,
				uni: units
			};
		}

	}
	function solveTranslation(pos) {

		let x, y;

		pos = refinePosition(pos);

		if (pos.left === '') {
			pos.left = 'auto';
		}
		if (pos.bottom === '') {
			pos.bottom = 'auto';
		}
		if (pos.top === '') {
			pos.top = 'auto';
		}
		if (pos.right === '') {
			pos.right = 'auto';
		}

		if (pos.left === 'auto' && pos.bottom === 'auto') {
			x = '50%';
			y = '-50%';
		} else if (pos.right === 'auto' && pos.bottom === 'auto') {
			x = '-50%';
			y = '-50%';
		} else if (pos.right === 'auto' && pos.top === 'auto') {
			x = '-50%';
			y = '50%';
		} else if (pos.left === 'auto' && pos.top === 'auto') {
			x = '50%';
			y = '50%';
		}

		return { x: x, y: y };

	}
	function setComponentPosition(position, elem) {

		if (opened) {

			position = refinePosition(position);
			const trans = solveTranslation(position);

			const top = parseValue(position.top);
			const bottom = parseValue(position.bottom);
			const left = parseValue(position.left);
			const right = parseValue(position.right);

			elem.style.top = top.num + top.uni;
			elem.style.bottom = bottom.num + bottom.uni;
			elem.style.left = left.num + left.uni;
			elem.style.right = right.num + right.uni;
			elem.style.transform = 'translate(' + trans.x + ', ' + trans.y + ')';

		}

	}
	function TouchGestures() {

		const gestures = new Finger();
		let initDir;
		let axis;

		gestures.track('drag', handleDrag);

		mainEl.addEventListener('lbxp-media-reveal', toggleGestures);

		function toggleGestures() {
			if (dataArray.length > 1) {
				return gestures.on(container.elem);
			}
			gestures.off(container.elem);
		}
		function handleDrag(gesture) {

			if (!initDir) setInitialMotion();

			const distance = gesture[axis] - gesture['start' + axis.toUpperCase()];

			switch (axis) {
				case 'x':
					gsap.set(container.elem, {
						x: distance
					});
					break;
				case 'y':
					gsap.set(container.elem, {
						y: distance
					});
					break;
				default:
					break;
			}

			if (gesture.flick) {

				onFlick(gesture);

			} else if (gesture.endX) {

				onDragEnd();

			}

			function setInitialMotion() {

				initDir = gesture.initial_direction;

				if (initDir === 'top' || initDir === 'bottom') {
					axis = 'y';
					return;
				}

				axis = 'x';

			}
			function onFlick(gesture) {

				let direction;
				container.swiped = true;
				const finalDirection = gesture.final_direction;

				if (finalDirection === 'right') {
					if (active === 0) return toInitialPosition();
					direction = -1;
				}
				if (finalDirection === 'left') {
					if (active === dataArray.length - 1) return toInitialPosition();
					direction = 1;
				}
				if (finalDirection === 'top') {
					direction = 1;
				}
				if (finalDirection === 'bottom') {
					direction = -1;
				}

				moveContainerOut(gesture.step, direction);

				function moveContainerOut(step, direction) {

					step = step < 35 ? step = 35 : step;
					let x = getTransform('X'),
						y = getTransform('Y');

					move();

					function getTransform(vector) {
						return gsap.getProperty(container.elem, 'translate' + vector);
					}
					function move() {

						switch (axis) {
							case 'x':
								x -= step * direction;
								break;
							case 'y':
								y -= step * direction;
								break;
							default:
								break;
						}

						container.elem.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';

						if (axis === 'x' && Math.abs(x) >= Math.abs(mainEl.clientWidth)) {
							axis = initDir = null;
							return open(active + direction);
						}
						if (axis === 'y' && Math.abs(y) >= Math.abs(mainEl.clientHeight)) {
							axis = initDir = null;
							return close();
						}

						window.requestAnimationFrame(move);

					}

				}

			}
			function onDragEnd() {

				let criticalDistance = mainEl.clientWidth / 3;

				if (axis === 'y') {
					criticalDistance = mainEl.clientHeight / 4;
				}

				if (Math.abs(distance) > criticalDistance) {

					if (axis === 'y') {

						let direction = 1;
						if (distance < 0) direction = -1;

						gsap.to(container.elem, {
							duration: 0.2,
							y: mainEl.clientHeight * direction,
							ease: 'power3.in',
							onComplete: close
						});
						return;

					} else {

						container.swiped = false;
						axis = initDir = null;

						if (distance > 0 && active !== 0) {
							return open(active - 1);
						} else if (distance < 0 && active !== dataArray.length - 1) {
							return open(active + 1);
						}

					}

				}

				toInitialPosition();

			}
			function toInitialPosition() {
				gsap.to(container.elem, {
					duration: 0.3,
					x: 0,
					y: 0,
					ease: 'power3'
				});
				axis = initDir = null;
			}

		}

	}
	function KeyboardControls() {

		mainEl.addEventListener('lbxp-opened', enable);
		mainEl.addEventListener('lbxp-closed', disable);

		function enable() {
			if (styleSettings.keyboard) {
				document.addEventListener('keydown', keyboard);
			}
		}
		function disable() {
			document.removeEventListener('keydown', keyboard);
		}

		function keyboard(e) {

			switch (e.keyCode) {
				case 39: // right arrow
					if (active === dataArray.length - 1) {
						deadEnd(-1);
					} else {
						open(active + 1);
					}
					break;
				case 37: // left arrow
					if (active === 0) {
						deadEnd(1);
					} else {
						open(active - 1);
					}
					break;
				case 27: // escape
					close();
					break;
				default:
					break;
			}

			function deadEnd(direction) {

				let jumpSize = container.elem.clientWidth / 8;

				gsap.to(container.elem, {
					duration: 0.15,
					x: jumpSize * direction,
					ease: 'power3.in',
					onComplete: function() {
						gsap.to(container.elem, {
							duration: 0.5,
							x: 0,
							ease: 'power3'
						});
					}

				});

			}

		}

	}
	function PreventScrollOnOpen() {

		mainEl.addEventListener('lbxp-opened', disableEvents);
		mainEl.addEventListener('lbxp-closed', enableEvents);

		function disableEvents() {
			if (!styleSettings.page_scroll) {
				document.addEventListener('touchmove', preventScroll, { passive: false });
				document.addEventListener('wheel', preventScroll, { passive: false });
				document.addEventListener('keydown', keyboard);
			}
		}
		function enableEvents() {
			document.removeEventListener('touchmove', preventScroll);
			document.removeEventListener('wheel', preventScroll);
			document.removeEventListener('keydown', keyboard);
		}
		function preventScroll(e) {
			e.preventDefault();
		}
		function keyboard(e) {

			switch (e.keyCode) {
				case 32: // space bar
				case 33: // page up
				case 34: // page down
				case 35: // end
				case 36: // home
				case 38: // arrow up
				case 40: // arrow down
					e.preventDefault();
					break;
				default:
					break;
			}

		}

	}
	function safariFullscreenFix() {

		document.addEventListener("fullscreenchange", function() {
			if (!document.fullscreenElement) {
				transformMediaContainer();
			} else {
				untransformMediaContainer();
			}
		}, false);
		document.addEventListener("webkitfullscreenchange", function() {
			if (!document.webkitFullscreenElement) {
				transformMediaContainer();
			} else {
				untransformMediaContainer();
			}
		}, false);

		function transformMediaContainer() {
			const media = container.elem.firstElementChild;
			media.style.cssText = getIframeCSS();
			if (media.tagName !== 'IFRAME') {
				media.style.width = videoFrame.width + 'px';
				media.style.height = videoFrame.height + 'px';
			}
		}
		function untransformMediaContainer() {
			container.elem.firstElementChild.style.cssText = 'transform: none';
		}

	}
	function getState() {
		return opened;
	}

}
function LiteBoxPro(opt) {

	'use strict';

	// all default settings
	const settings = {
		target: document.body,
		z_index: 100,
		dom_element: document.body,
		theme_color: '#FFF',
		merged_gallery: false,
		mobile_width: '504px',
		mobile_height: '380px',
		cursor: 'pointer',
		line_width: 3,
		page_scroll: false,
		keyboard: true,
		video: {
			autoplay: true
		},
		media: {
			default: {
				corner_radius: '3px',
				margin: {
					top: '80px',
					bottom: '80px',
					left: '80px',
					right: '80px',
				}
			},
			mobile: {
				corner_radius: '3px',
				margin: {
					top: '50px',
					bottom: '50px',
					left: '20px',
					right: '20px',
				}
			}
		},
		background: {
			default: {
				hide: false,
				opacity: 0.85,
				color: '#0B121A'
			},
			mobile: {
				hide: false,
				opacity: 1,
				color: '#0B121A'
			}
		},
		pager: {
			default: {
				hide: false,
				img_width: '6px',
				img_height: '6px',
				click_width: '32px',
				click_height: '32px',
				gap: 0,
				inactive_opacity: 0.3,
				max_width: '70%',
				// img_inactive: 		'url',		// not done
				// img_active: 		'url',		// not done
				position: {
					top: 'auto',
					right: 'auto',
					bottom: '40px',
					left: '50%'
				}
			},
			mobile: {
				hide: false,
				img_width: '6px',
				img_height: '6px',
				click_width: '32px',
				click_height: '32px',
				gap: 0,
				inactive_opacity: 0.3,
				max_width: '80%',
				// img_inactive: 		'url',		// not done
				// img_active: 		'url',		// not done
				position: {
					top: 'auto',
					right: 'auto',
					bottom: '26px',
					left: '50%'
				}
			}
		},
		arrows: {
			default: {
				hide: false,
				img_width: '50px',
				img_height: '80px',
				click_width: '80px',
				click_height: '100%',
				inactive_opacity: 0.2,
				// relative_to: 		'media', // default — to page
				// img_left:			'url',
				// img_right:			'url',
				position_left: {
					top: '50%',
					right: 'auto',
					bottom: 'auto',
					left: '40px'
				},
				position_right: {
					top: '50%',
					right: '40px',
					bottom: 'auto',
					left: 'auto'
				}
			},
			mobile: {
				hide: true,
				img_width: '33px',
				img_height: '53px',
				click_width: '40px',
				click_height: '100%',
				inactive_opacity: 0.2,
				// relative_to: 		'media', // default — to page
				// img_left:			'url',
				// img_right:			'url',
				position_left: {
					top: '50%',
					right: 'auto',
					bottom: 'auto',
					left: '20px'
				},
				position_right: {
					top: '50%',
					right: '20px',
					bottom: 'auto',
					left: 'auto'
				}
			}
		},
		close_btn: {
			default: {
				hide: false,
				img_width: '24px',
				img_height: '24px',
				click_width: '48px',
				click_height: '48px',
				// relative_to: 		'media', // default — to page
				position: {
					top: '40px',
					right: '40px',
					bottom: 'auto',
					left: 'auto'
				}
			},
			mobile: {
				hide: false,
				img_width: '18px',
				img_height: '18px',
				click_width: '40px',
				click_height: '40px',
				// relative_to: 		'media', // default — to page
				position: {
					top: '30px',
					right: '30px',
					bottom: 'auto',
					left: 'auto'
				}
			}
		},
		preloader: {
			default: {
				size: '64px'
			},
			mobile: {
				size: '64px'
			}
		}
	};



	// If in settings { mergedGallery: true } then in this array
	// those indivitual galleries will be stored.
	let sequence = [];

	if (typeof (opt) === 'string') {
		settings.dom_element = opt;
	} else {
		scanCustomProps(opt, settings);
	}

	initGalleries();

	if (videoServicesFound.length > 0) addThirdPartyVideoScripts(videoServicesFound);

	this.sequence = sequence;
	this.settings = settings;


	function scanCustomProps(obj, trg) { // replace default settings with custom values

		for (let prop in obj) {
			if (typeof obj[prop] === 'object' && !isDOM(obj[prop])) {
				if (prop === 'position') { // if custom settings have 'position' node
					obj[prop] = refinePosition(obj[prop]);
				}
				scanCustomProps(obj[prop], trg[prop]); // repeat recursion
			} else {
				trg[prop] = obj[prop]; // replace properties
			}
		}

		function isDOM(object) {
			return object instanceof HTMLElement;
		}

	}
	function initGalleries() {

		const sequenceDOMs = findSequences(); // gallery DOM elements
		if (sequenceDOMs.length < 1) return console.warn('liteBox.pro:\nNo gallery sequences found on the page.');

		processSequences();

		function findSequences() {

			const els = settings.dom_element;

			switch (typeof (els)) {
				case 'string':
					return document.querySelectorAll(els);
				case 'object':
					return [els];
				default:
					console.error('liteBox.pro:\nDeclared unsupported type of variable as gallery selector. To define a gallery you should use either CSS selector (string) or a JavaScript [Object] reference.');
					return;
			}

		}
		function processSequences() {

			let arrays = [];
			let mergedSequences = [];

			for (let i = 0; i < sequenceDOMs.length; i++) {
				arrays[i] = Array.prototype.slice.call(sequenceDOMs[i].querySelectorAll(lbxpAttributes));
			}

			if (settings.merged_gallery) {

				for (let i = 0; i < arrays.length; i++) {
					mergedSequences = mergedSequences.concat(arrays[i]);
				}
				createSubSequence({
					index: 0,
					sequenceElems: mergedSequences,
					sequenceDOM: sequenceDOMs[0]
				});

			} else {

				for (let i = 0; i < arrays.length; i++) {
					createSubSequence({
						index: i,
						sequenceElems: arrays[i],
						sequenceDOM: sequenceDOMs[i]
					});
				}

			}

			function createSubSequence(dat) {
				sequence[dat.index] = new SubGallery(dat);
			}

		}

	}
	function SubGallery(dat) {

		const index = dat.index;
		const elem = dat.sequenceDOM;
		let itemArray = [];
		let dataArray = [];

		makeDataArray();
		itemArray.forEach(setActions);

		this.index = index;
		this.elem = elem;
		this.items = itemArray;
		this.data = dataArray;

		function makeDataArray() {

			dat.sequenceElems.forEach(parseAttributes);

			function parseAttributes(htmlElement) {

				const attributes = htmlElement.dataset;
				let mediaItem = {
					// type: null, 			// image / video / html / ...
					// source: null,
					// video_hosting: null,
					// video_id: null
				};

				getDataForMediaItem(attributes);
				saveObject();

				function getDataForMediaItem(attributes) {
					if ('lbxpVideo' in attributes) return setVideoProperties(true);
					if ('lbxpImg' in attributes) return setImageProperties(true);
					if ('lbxpHtml' in attributes) return setHTMLProperties(true);
					if ('lbxpIframe' in attributes) return setIframeProperties(true);
					if ('lbxp' in attributes) {

						if (htmlElement.tagName === 'IMG') return setImageProperties(false);
						if (htmlElement.href) return parseURL(htmlElement.href);

						return nothingFound();

					}
				}

				function setVideoProperties(strict) {

					mediaItem.type = 'video';

					if ('lbxpVideoPoster' in attributes) {
						mediaItem.poster = htmlElement.dataset.lbxpVideoPoster
					}

					let source = htmlElement.href;
					if (strict && attributes.lbxpVideo !== '') {
						source = attributes.lbxpVideo;
					}

					mediaItem.source = source.split('|');
					mediaItem.source = mediaItem.source.map(function(item) {
						return item.trim();
					});

					const hosting = getVideoHosting(source);
					mediaItem.video_hosting = hosting.video_hosting;

					if (hosting.video_hosting !== 'local') {
						mediaItem.video_id = getVideoID(source, hosting.domain);
					}

				}
				function setImageProperties(strict) {
					mediaItem.type = 'image';
					if (strict && attributes.lbxpImg !== '') {
						return mediaItem.source = attributes.lbxpImg;
					}
					if (htmlElement.src) return mediaItem.source = htmlElement.src;
					if (htmlElement.href) return mediaItem.source = htmlElement.href;
					return nothingFound();
				}
				function setHTMLProperties(strict) {
					mediaItem.type = 'html';
					if (strict && attributes.lbxpHtml !== '') {
						return mediaItem.source = attributes.lbxpHtml;
					}
					mediaItem.source = htmlElement.href;
				}
				function setIframeProperties(strict) {
					mediaItem.type = 'iframe';
					if (strict && attributes.lbxpIframe !== '') {
						return mediaItem.source = attributes.lbxpIframe;
					}
					mediaItem.source = htmlElement.href;
				}

				function parseURL(string) {

					// try to find video
					if (getVideoHosting(string)) return setVideoProperties();

					// try to find HTML page
					if (matchFormat(formats.html, string)) return setHTMLProperties();

					// image sets as default
					setImageProperties();

				}
				function getVideoHosting(string) {

					// search through all video hosting domains
					const names = Object.keys(videoServices);

					for (let j = 0; j < names.length; j++) {
						const name = names[j];
						for (let i = 0; i < videoServices[name].domains.length; i++) {
							let match;
							if (match = string.match(videoServices[name].domains[i])) {
								let counter = 0;
								for (let i = 0; i < videoServicesFound.length; i++) {
									if (videoServicesFound[i] === name) {
										counter += 1;
									}
								}
								if (counter === 0) videoServicesFound.push(name);
								return {
									video_hosting: name,
									domain: match[0]
								};
							}
							if (matchFormat(formats.video, string)) {
								return {
									video_hosting: 'local'
								};
							}
						}
					}

				}
				function getVideoID(string, domain) {

					switch (domain) {
						// https://www.youtube.com/watch?v=XXXXXXXXXXX
						case 'youtube.com': return parseYoutubeCom(string);
						// https://youtu.be/XXXXXXXXXXX
						case 'youtu.be': return parseOtherYoutubeUrls(string, '.be/');
						// https://youtu.be/XXXXXXXXXXX
						case 'youtube-nocookie.com': return parseOtherYoutubeUrls(string, 'embed/');
						default: break;
					}

					function parseYoutubeCom(string) {
						const query = string.match(/\?(.*)/);
						const params = query[1].split('&');
						for (let i = 0; i < params.length; i++) {
							const pair = params[i].split('=');
							if (pair[0] === 'v') {
								return pair[1];
							}
						}
					}
					function parseOtherYoutubeUrls(string, separator) {
						const everythingBeforeQuery = /^.*(?=(\?))/;
						const parts = string.split(separator);
						if (everythingBeforeQuery.test(parts[1])) {
							return parts[1].match(everythingBeforeQuery)[0];
						}
						return parts[1];
					}

				}
				function saveObject() {

					if (mediaItem.type) {
						dataArray.push(mediaItem);
						itemArray.push(htmlElement);
					}

				}
				function nothingFound() {
					console.warn('liteBox.pro:\nLink not found in the tag <' + htmlElement.tagName + '>:\n', htmlElement);
				}

			}

		}
		function setActions(item, i) {

			item.style.cursor = settings.cursor;
			item.dataset.lbxpN = i;
			// item.onclick = function(e) {
			// 	e.preventDefault();
			// 	e.stopPropagation();
			// 	lbxp.open(i, dataArray, settings);
			// };

		}

	}

	function matchFormat(formats, string) {
		const extension = getExtension(string);
		for (let i = 0; i < formats.length; i++) {
			if (formats[i] === extension) return true;
		}
		return false;
	}
	function addThirdPartyVideoScripts(foundServices) {

		foundServices.forEach(function(name) {
			const service = videoServices[name];
			if (!service.added) {
				service.added = true;
				insertScriptTag(
					service.scripts,
					'beforebegin',
					document.querySelectorAll('script')[0]
				);
			}
		});

	}

}

function refinePosition(node) {
	'use strict';
	// clean up user's custom values
	let corrected = {};

	if (node.right && node.left) {
		if (node.left === 'auto') {
			corrected.left = 'auto';
			corrected.right = node.right;
		} else {
			corrected.right = 'auto';
			corrected.left = node.left;
		}
	} else if (node.right) {
		corrected.right = node.right;
		corrected.left = 'auto';
	} else if (node.left) {
		corrected.left = node.left;
		corrected.right = 'auto';
	}

	if (node.top && node.bottom) {
		if (node.top === 'auto') {
			corrected.top = 'auto';
			corrected.bottom = node.bottom;
		} else {
			corrected.bottom = 'auto';
			corrected.top = node.top;
		}
	} else if (node.top) {
		corrected.top = node.top;
		corrected.bottom = 'auto';
	} else if (node.bottom) {
		corrected.bottom = node.bottom;
		corrected.top = 'auto';
	}

	return corrected;

}
function getExtension(string) {
	'use strict';
	const regex = /\.\w{3,4}$/g;
	const match = string.match(regex);
	if (match) return match[0];
	return null;
}
function insertScriptTag(url, where, target) {
	'use strict';

	if (!document.querySelector('[src="' + url + '"]')) {
		let tag = document.createElement('script');
		tag.src = url;
		target.insertAdjacentElement(where, tag);
	}

}
function Finger(area, settings) {

	const pressTime = 350;
	const doubleTapInterval = 250;
	const FLICK_TRESHOLD = 0.7;

	let gestureType,
		finger = this,
		moving = false,
		pressTimer,
		currentTouch = {},
		startTime,
		tapReleaseTime,
		startX,
		startY,
		endX,
		endY,
		rotationAngleStart,
		totalAngleStart,
		previousAngle = null,
		angleRelative = null,
		revs = 0,
		negativeRev = false,
		distanceStart,
		watching = {},
		preventDefaults = {},
		touchHistory = [],
		initialDirection;

	this.on = on;
	this.off = off;
	this.track = track;
	this.untrack = untrack;

	if (area) on(area);

	function on(area) {
		area.addEventListener('touchstart', detectGesture);
		area.addEventListener('touchmove', detectGesture);
		area.addEventListener('touchend', detectGesture);
	}
	function off(area) {
		area.removeEventListener('touchstart', detectGesture);
		area.removeEventListener('touchmove', detectGesture);
		area.removeEventListener('touchend', detectGesture);
	}
	function track(gesture, callback, settings) {
		watching[gesture] = callback;
		if (settings) {
			if (settings.preventDefault === true) {
				preventDefaults[gesture] = true;
			}
			if (settings.preventDefault === 'horizontal') {
				preventDefaults[gesture] = 'horizontal';
			}
			if (settings.preventDefault === 'vertical') {
				preventDefaults[gesture] = 'vertical';
			}
		}
	}
	function untrack(gesture) {
		delete watching[gesture];
	}

	function detectGesture(e) {

		if (settings && settings.preventDefault) {
			e.preventDefault();
		}

		const touches = e.touches;
		const timestamp = e.timeStamp;

		let params = [];

		if (e.type === 'touchstart') {

			startTime = timestamp;
			previousAngle = null;
			angleRelative = null;
			revs = 0;
			negativeRev = false;
			gestureType = null;

			createTouches(touches);

			switch (touches.length) {
				case 1:
					pressTimer = setTimeout(function() {
						gestureType = 'press';
						currentTouch = { x: startX, y: startY };
						params = [currentTouch];
						callback(gestureType, params);
					}, pressTime);
					break;
				case 2:
					const x1 = touches[0].clientX,
						y1 = touches[0].clientY,
						x2 = touches[1].clientX,
						y2 = touches[1].clientY;
					rotationAngleStart = getAngle(x1, y1, x2, y2);
					distanceStart = getDistance(x1, y1, x2, y2);

					if (rotationAngleStart > 180) {
						totalAngleStart = (360 * revs + rotationAngleStart) - 360;
					} else {
						totalAngleStart = 360 * revs + rotationAngleStart;
					}
					break;
				default:
					break;
			}

		}
		if (e.type === 'touchmove') {

			clearTimeout(pressTimer);
			moving = true;

			const x = touches[0].clientX;
			const y = touches[0].clientY;

			saveToHistory(touches);

			currentTouch = {};

			switch (touches.length) {
				case 1:
					if (gestureType !== 'pinch-spread') {
						currentTouch.x = x;
						currentTouch.y = y;
						currentTouch.startX = startX;
						currentTouch.startY = startY;
						currentTouch.step = getStepSpeed(touchHistory);
						currentTouch.speed = getSpeed();
						currentTouch.angle = getAngle(startX, startY, x, y);

						if (!initialDirection) {
							initialDirection = getDirection(startX, startY, x, y);
							currentTouch.initial_direction = initialDirection;
						}

						gestureType = 'drag';
						params = [currentTouch, touchHistory];
						callback(gestureType, params);
					}
					break;
				case 2:
					const x1 = touches[0].clientX,
						y1 = touches[0].clientY,
						x2 = touches[1].clientX,
						y2 = touches[1].clientY;
					const distance = getDistance(x1, y1, x2, y2);
					const scale = getScale(distanceStart, distance);
					const angleAbsolute = getAngle(x1, y1, x2, y2);

					if (angleAbsolute - previousAngle <= -180) {
						if (negativeRev) {
							revs === 0;
							negativeRev = false;
						} else {
							revs++;
						}
					} else if (angleAbsolute - previousAngle >= 180) {
						if (revs === 0 && !negativeRev) {
							negativeRev = true;
						} else {
							revs--;
						}
					}

					if (negativeRev || revs < 0) {
						angleRelative = (360 * revs + angleAbsolute) - 360;
					} else {
						angleRelative = 360 * revs + angleAbsolute;
					}

					const rotation = angleRelative - totalAngleStart;
					previousAngle = angleAbsolute;

					gestureType = 'rotate';
					currentTouch = {
						touches: [
							{ x: x1, y: y2 },
							{ x: x2, y: y2 }
						],
						rotation: rotation,
						angleAbsolute: angleAbsolute,
						angleRelative: angleRelative
					}
					params = [currentTouch, touchHistory];
					callback(gestureType, params);

					gestureType = 'pinch-spread';
					currentTouch = {
						touches: [
							{ x: x1, y: y2 },
							{ x: x2, y: y2 }
						],
						distance: distance,
						scale: scale
					}
					params = [currentTouch, touchHistory];
					callback(gestureType, params);

					break;
				default:
					break;
			}

		}
		if (e.type === 'touchend') {
			finishTouch();
			moving = false;
		}

		if (preventDefaults[gestureType] === true) e.preventDefault();
		if (preventDefaults[gestureType] === 'horizontal') {
			if (
				currentTouch.angle > 45 && currentTouch.angle < 135 ||
				currentTouch.angle > 225 && currentTouch.angle < 315
			) {
				e.preventDefault();
			}
		}
		if (preventDefaults[gestureType] === 'vertical') {
			if (
				currentTouch.angle > 315 && currentTouch.angle < 45 ||
				currentTouch.angle > 135 && currentTouch.angle < 225
			) {
				e.preventDefault();
			}
		}

		function createTouches(touches) {
			for (let i = 0; i < touches.length; i++) {
				if (!touchHistory[i]) {
					const touch = touches[i];
					startX = touch.clientX;
					startY = touch.clientY;
					touchHistory.push(touch);
					touchHistory[i] = {
						x: [startX],
						y: [startY],
						t: [timestamp]
					}
				}
			}
		}
		function saveToHistory(touches) {

			if (touchHistory.length > 0) {
				for (let i = 0; i < touches.length; i++) {
					touchHistory[i].x.push(touches[i].clientX);
					touchHistory[i].y.push(touches[i].clientY);
					touchHistory[i].t.push(timestamp);
				}
			}

		}
		function getStepSpeed(touchHistory) {
			let xDelta;
			touchHistory.forEach(function(touch) {
				const xArr = touch.x;
				const xLast = xArr[xArr.length - 1];
				const xPreLast = xArr[xArr.length - 2];
				xDelta = Math.abs(xLast - xPreLast);
			});
			return xDelta;
		}
		function finishTouch() {

			if (!moving && timestamp - startTime < pressTime) {

				clearTimeout(pressTimer);

				if (timestamp < tapReleaseTime + doubleTapInterval + pressTime) {
					tapReleaseTime = null;
					gestureType = 'double-tap';
				} else {
					tapReleaseTime = timestamp;
					gestureType = 'tap';
				}

				currentTouch = { x: startX, y: startY };
				params = [currentTouch];
				callback(gestureType, params);

			} else if (moving && touchHistory.length > 0) {

				if (gestureType !== 'pinch-spread') {

					const xArray = touchHistory[0].x;
					const yArray = touchHistory[0].y;
					endX = xArray[xArray.length - 1];
					endY = yArray[yArray.length - 1];
					currentTouch.endX = endX;
					currentTouch.endY = endY;

					currentTouch.speed = getSpeed();
					currentTouch.initial_direction = initialDirection;

					currentTouch.final_direction = getDirection(
						touchHistory[0].x[touchHistory[0].x.length - 2],
						touchHistory[0].y[touchHistory[0].y.length - 2],
						currentTouch.endX,
						currentTouch.endY
					);

					gestureType = 'drag';

					if (currentTouch.speed >= FLICK_TRESHOLD) {
						currentTouch.flick = true;
					} else {
						currentTouch.flick = false;
					}

					params = [currentTouch, touchHistory];
					callback(gestureType, params);

				} else {
					currentTouch.end = true;
					params = [currentTouch, touchHistory];
					callback(gestureType, params);
					touchHistory = [];
				}

			}

			if (touches.length === 0) touchHistory = [];

			initialDirection = null;

		}
		function getSpeed() {

			let tailArrayX = touchHistory[0].x;
			let tailArrayY = touchHistory[0].y;
			let tailArrayT = touchHistory[0].t;
			let time, xDistance, yDistance, distance;

			// extract last 5 records from history

			if (touchHistory[0].x.length >= 5) {
				tailArrayX = touchHistory[0].x.slice(-5, touchHistory[0].x.length);
				tailArrayY = touchHistory[0].y.slice(-5, touchHistory[0].y.length);
				tailArrayT = touchHistory[0].t.slice(-5, touchHistory[0].t.length);
			}

			time = tailArrayT[tailArrayT.length - 1] - tailArrayT[0];

			distance = getDistance(
				tailArrayX[0],
				tailArrayY[0],
				tailArrayX[tailArrayX.length - 1],
				tailArrayY[tailArrayY.length - 1]
			);

			return distance / time;

		}
		function getDistance(x1, y1, x2, y2) {
			const height = y2 - y1,
				width = x2 - x1;
			return Math.hypot(width, height);
		}
		function getScale(distanceStart, distance) {
			return distance / distanceStart;
		}
		function callback(gestureType, params) {
			if (touchHistory.length > 0) {
				if (watching[gestureType]) watching[gestureType].apply(this, params);
			}
		}
		function getAngle(sX, sY, eX, eY) {
			const dX = eX - sX;
			const dY = eY - sY;
			const radians = Math.atan2(dY, dX);
			let angle = radians * 180 / Math.PI + 90;
			if (angle < 0) angle += 360;
			if (angle > 360) angle -= 360;
			return angle;
		}
		function getDirection(startX, startY, x, y) {

			const angle = getAngle(startX, startY, x, y);

			if (angle >= 315 || angle < 45) {
				return 'top';
			}
			if (angle >= 45 && angle < 135) {
				return 'right';
			}
			if (angle >= 135 && angle < 225) {
				return 'bottom';
			}
			if (angle >= 225 && angle < 315) {
				return 'left';
			}
		}

	}

}

// ======= liteBox.pro above =======

const user = new User();
headerBackdrop();
mobileMenu();
bgImageSafariFix();

if ($('#roadmap') && window.innerWidth > 1280) mapReveal();
if ($('.img_decor')) controlAsideDecor();
if ($('.img_block') && window.innerWidth > 1280) revealImages();
if ($('.hero_block')) parallax();
if ($('.main_nav')) smoothAutoScroll();
if ($('.js_posters_gallery')) enableGalleries();

function User() {

	const cursorType = checkCursorType();

	this.cursor = cursorType;

	function checkCursorType() {

		let regular = window.matchMedia('(pointer:fine)');
		let touch = window.matchMedia('(pointer:coarse)');

		if (regular.matches) {
			return 'fine'; // обычный курсор
		} else if (touch.matches) {
			return 'coarse'; // тач-скрин
		} else {
			return 'none'; // устройство без курсора
		}

	}

}
function mobileMenu() {

	const burger = $('.btn_mob_js');

	burger.onclick = () => {
		$('.nav_holder_js').classList.toggle('opened');
		burger.classList.toggle('opened');
	};

}
function headerBackdrop() {
	document.addEventListener('scroll', () => {
		const header = $('.header_js');
		if (window.scrollY >= 50) return header.classList.add('header_scrolled');
		header.classList.remove('header_scrolled');
	});
}
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

		const TRANSITION = 1; // posters swapping speed

		const list = root.querySelector('.slider > ul');
		const posters = Array.from(list.children);
		const description = root.querySelector('.slider_title');

		const posterTitle = description.querySelector('h3');
		const posterRarity = description.querySelector('.rarity');
		const posterBonus = description.querySelector('.bonus');
		const posterDescription = description.querySelector('p');

		let previousActivePoster;
		let activePoster;
		let listStartX;
		let dragging = false;

		description.style.visibility = 'hidden';

		const gestures = new Finger();
		gestures.track('drag', handleDrag, { preventDefault: 'horizontal' });

		posters.forEach((poster, i) => {

			poster.dataset.order = i;
			poster.onclick = event => {

				event.preventDefault();

				if (poster.classList.contains('active')) return openPopup(poster);

				highlightPoster(i);

			};

		});

		const arrows = new Arrows();

		highlightPoster(1);

		const lbxpGallery = new LiteBoxPro({
			background: {
				default: {
					opacity: 0.8,
					color: "#000"
				},
				mobile: {
					opacity: 0.8,
					color: "#000"
				}
			},
			dom_element: list
		});

		function openPopup(poster) {

			const i = poster.dataset.order;
			const dataArray = lbxpGallery.sequence[0].data;
			const settings = lbxpGallery.settings;

			lbxp.open(i, dataArray, settings);

		}
		function highlightPoster(index) {

			activePoster = posters[index];

			let highlightedPosterExists = false;

			posters.forEach(poster => {
				if (poster.classList.contains('active')) highlightedPosterExists = true;
				if (poster === activePoster) {
					poster.classList.add('active');
					if (user.cursor === 'coarse') gestures.on(poster);
					return;
				}
				poster.classList.remove('active');
				gestures.off(poster);
			});

			swapDescription();
			shiftList();

			previousActivePoster = activePoster;

			function swapDescription() {

				if (highlightedPosterExists) temporarityFixListHeight();

				// const direction = getScrollDirection();

				gsap.to(description, {
					duration: TRANSITION / 2,
					// x: 100 * direction,
					autoAlpha: 0,
					ease: 'power2.inOut',
					onComplete: replaceContent
				});

				// gsap.set(description, {
				//     delay: TRANSITION / 2,
				//    	x: 100 * -direction
				// });

				arrows.check(index);

				gsap.to(description, {
					delay: TRANSITION / 2,
					duration: TRANSITION / 2,
					// x: 0 * direction,
					autoAlpha: 1,
					ease: 'power2.inOut'
				});

				function replaceContent() {

					const data = activePoster.dataset;

					posterTitle.innerText = data.title;
					posterRarity.innerText = data.rarity;
					posterBonus.innerText = data.bonus;

					if (posterDescription) {
						posterDescription.innerText = data.description;
					}

				}

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
			function getScrollDirection() {

				if (previousActivePoster) {

					const currentIndex = +activePoster.dataset.order;
					const previousIndex = +previousActivePoster.dataset.order;

					if (currentIndex > previousIndex) return -1;
					return 1;

				} else {

					return 0;

				}

			}

		}
		function Arrows() {

			const btnNext = root.querySelector('.link_next');
			const btnPrev = root.querySelector('.link_prev');

			btnNext.onclick = event => {

				event.preventDefault();
				const index = +activePoster.dataset.order + 1;

				if (index < posters.length) highlightPoster(index);

			};
			btnPrev.onclick = event => {

				event.preventDefault();
				const index = +activePoster.dataset.order - 1;

				if (index >= 0) highlightPoster(index);

			};

			this.check = check;

			function check(index) {

				if (index <= 0) {
					btnPrev.style.visibility = 'hidden';
					btnNext.style.visibility = 'visible';
				} else if (index >= posters.length - 1) {
					btnPrev.style.visibility = 'visible';
					btnNext.style.visibility = 'hidden';
				} else {
					btnPrev.style.visibility = 'visible';
					btnNext.style.visibility = 'visible';
				}

			}

		}
		function handleDrag(g) {

			if (g.initial_direction === 'top' || g.initial_direction === 'bottom') return;

			const activeIndex = +activePoster.dataset.order;
			const distance = g.x - g.startX;

			if (g.endX) {

				dragging = false;

				if (activeIndex === 0 && distance > 0) {
					backToStart(0);
					return
				}
				if (activeIndex === posters.length - 1 && distance < 0) {
					const length = getPosterWidthWithMargin() * (posters.length - 1);
					return backToStart(-length);
				}

				let direction = 1;
				if (g.final_direction === 'right') direction = -1;

				if (Math.abs(distance) >= window.innerWidth / 4 || g.flick) {
					highlightPoster(+activePoster.dataset.order + direction);
				} else {
					backToStart();
				}

				return;

			}

			if (!dragging) {
				listStartX = gsap.getProperty(list, 'x');
				dragging = true;
			}

			gsap.set(list, {
				x: listStartX + distance
			});

			function backToStart(coord) {

				if (coord === undefined) {

					gsap.to(list, {
						duration: 0.5,
						x: listStartX,
						ease: 'power3.out'
					});

				} else {

					gsap.to(list, {
						duration: 0.5,
						x: coord,
						ease: 'power3.out'
					});

				}

			}

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
function bgImageSafariFix() {

	// fix bg image size in iOS Safari, on scroll

	const bgImg = $('.back_image');
	window.addEventListener('resize', () => {
		gsap.to(bgImg, {
			duration: 1,
			height: window.innerHeight,
			ease: 'power2.inOut'
		});
	});

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
