/*
 * Sliding menu
 * ============
 * version: 0.5 beta
 * author: Kostas Kapenekakis
 * depencencies: jQuery, fun, magic;
 * 
 * Initialize like this: 
 * 
 $("#menu").slidemenu({
	content: $(".container"),
	button: $("button")
 });
 */
(function($) {

$.slidemenu = function( options, menu ) {
	this.settings = $.extend( true, {}, $.slidemenu.defaults, options );
	this.menu = $(menu);
	this.init();
};

$.extend($.slidemenu, {

	defaults: {
		content: $([]),
		button: $([]),
		position: 'left',
		stime: 200,
		ssize: 250,
		open: false,
		close: true
	}, // end defaults

	setDefaults: function( settings ) {
		$.extend( $.slidemenu.defaults, settings );
	},

	prototype: {

		init: function() {

			if( typeof this.settings.content == "string" )
				this.settings.content = $(this.settings.content);
			if( typeof this.settings.button == "string" )
				this.settings.button = $(this.settings.button);

			// initialise
			this.style_objects();
			this.trigger_events();

			console.log('%c slidingmenu (' + this.settings.position + ') : %c initialized ', 'background-color:#333; color:lightgrey; border-radius:3px;', 'margin-left:10px; background-color:#333; color:lightgreen; border-radius:3px;');
		},

		toggle_state: function(){
			if (this.menu.hasClass('closed'))
				this.slide('open');
			else
				this.slide('close');
		},

		slide: function (action) {

			var left = 0;
			if( action === "open" )
				if( this.settings.position === "left" )
					left = this.settings.ssize;
				else
					left = -this.settings.ssize;

			if(left !== 0) {
				$('#dark-map-overlay').fadeIn('fast');
				this.menu.removeClass('closed');
			}

			this.settings.content.animate({'left':left}, this.settings.stime, 'swing', (function(){
				if (left === 0){
					$('#dark-map-overlay').fadeOut('fast');
					$('.slidemenu-sidebar').addClass('closed');
				}
				return false;
			}).bind(this));
		},

		slideopen: function(){ this.slide('open'); },

		slideclose: function(){ this.slide('close'); },

		style_objects: function(){
			this.settings.content.parents().addClass('full-height');
			this.settings.button.addClass('slidemenu-button');
			this.settings.content.addClass('slidemenu-main-content');
			this.menu.addClass('slidemenu-sidebar closed');

			$('.slidemenu-sidebar').css('max-width', this.settings.ssize + 20);

			if (this.settings.position === 'left')
				this.menu.addClass('left-side-bar');
			else
				this.menu.addClass('right-side-bar');
		},

		trigger_events: function(){
			this.slideclose();

			this.settings.button.click( (function(e){
				this.toggle_state();
			}).bind(this) );

			this.settings.content.click( (function(e){
				if ( !this.menu.hasClass('closed') && e.target.id !== this.settings.button.attr('id') )
					this.slideclose();
			}).bind(this) );

			if (this.settings.close === true || this.settings.open === true){
				//console.log('touch enabled');
				var touch_begins, touch_finishes;

				document.addEventListener('touchstart', function(e) {
						var touch = e.touches[0];
						touch_begins = touch.pageX;
						//console.log( 'start: ' + touch.pageX );
				}, false);

				document.addEventListener('touchmove', function(e) {
						e.preventDefault();
						var touch = e.touches[0];
						touch_finishes = touch.pageX;
				}, false);

				document.addEventListener('touchend', (function(e) {
					//console.log( 'end: ' + touch_finishes );
					if (this.settings.close === true && !this.menu.hasClass('closed')){
						//e.preventDefault();
						if (touch_finishes && touch_finishes !== '' && touch_begins && touch_begins !== ''){
							if (this.settings.position === 'left'){
								if (touch_finishes < touch_begins && (touch_begins - touch_finishes) > 30){
									this.slideclose();
									touch_reset();
								}
							} else if (this.settings.position === 'right') {
								if (touch_finishes > touch_begins && (touch_finishes - touch_begins) > 30){
									this.slideclose();
									touch_reset();
								}
							}
						}
					} else if (this.settings.open === true && this.menu.hasClass('closed')){
						if (touch_finishes && touch_finishes !== '' && touch_begins && touch_begins !== ''){
							if (this.settings.position === 'left'){
								if (touch_finishes > touch_begins && (touch_finishes - touch_begins) > 200){
									this.slideopen();
									touch_reset();
								}
							} else if (this.settings.position === 'right') {
								if (touch_finishes < touch_begins && (touch_begins - touch_finishes) > 200){
									this.slideopen();
									touch_reset();
								}
							}
						}
					}
				}).bind(this), false);

				touch_reset = function(){
					touch_finishes = '';
					touch_begins = '';
				};
			}

		}
	} // end prototype
});


$.fn.slidemenu = function( options ) {

	if( !this.length )
	{
		console.warn("Nothing selected, cannot setup slidemenu.");
		return this;
	}

	// check if this element already has a slide menu setup
	var slidemenu = $.data( this[0], "slidemenu" );
	if( slidemenu ) 
		return slidemenu;

	slidemenu = new $.slidemenu( options, this[0] );
	$.data( this[0], "slidemenu", slidemenu );

	// return this to allow chaining
	return slidemenu;
};

}(jQuery));

/* End of Sliding menu plugin */