$(document).ready(function(){
	$(window).scroll(function(){
	    if ($(window).scrollTop() >= 50) {
	        $('.header_js').addClass('header_scrolled');
	    }
	    else {
	        $('.header_js').removeClass('header_scrolled');
	    }
	});
	// mob menu
	$(".btn_mob_js").click(function(){
        $(".nav_holder_js").toggleClass("opened");
        $(this).toggleClass("opened");
    });
});