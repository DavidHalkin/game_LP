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

function $(selector) {
	return document.querySelector(selector);
}
