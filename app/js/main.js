$(document).ready(function(){
	$(window).scroll(function(){
	    if ($(window).scrollTop() >= 50) {
	        $('.header_js').addClass('header_scrolled');
	    }
	    else {
	        $('.header_js').removeClass('header_scrolled');
	    }
	});
});