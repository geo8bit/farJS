farResize = function() {
	var contWidth  = parseFloat($('.farContainer').attr('data-width'));
	var contHeight = parseFloat($('.farContainer').attr('data-height'));
	var contRatio = contWidth / contHeight;
	if (contWidth > contHeight)
		var scale = contWidth;
	else
		var scale = contHeight;

	var winWidth = $(window).width();
	var winHeight = $(window).height();
	var winRatio = winWidth / winHeight;

	if (winRatio > contRatio) {
		var adjHeight = winHeight;
		var adjWidth = adjHeight * contRatio;
	}
	else {
		var adjWidth = winWidth;
		var adjHeight = adjWidth / contRatio;
	}

	if (adjWidth > adjHeight)
		var adjust = adjWidth;
	else
		var adjust = adjHeight;

	var contLeft = winWidth/2 - adjWidth/2;
	var contTop = winHeight/2 - adjHeight/2;

	$('.farContainer').width(adjWidth);
	$('.farContainer').height(adjHeight);
	$('.farContainer').offset({top: contTop, left: contLeft})

	$('.farContainer .farImg').each(function() {
		var elWidth = parseFloat($(this).attr('data-width')) / scale;
		var elHeight = parseFloat($(this).attr('data-height')) / scale;
		var elLeft = parseFloat($(this).attr('data-left')) / scale;
		var elTop = parseFloat($(this).attr('data-top')) / scale;
		$(this).width(elWidth * adjust).height(elHeight * adjust).offset({left: contLeft + elLeft*adjust, top: contTop + elTop* adjust});
		$(this).css('visibility', 'visible');
	});

	var font = parseFloat($('.farContainer').attr('data-font'));
	var adjFont = font * adjust / scale;
	$('.farContainer').css('font-size', adjFont + '%');
}

$(document).ready(function() {
	$(window).resize(function() {
		farResize();	
	});
	farResize();
});

