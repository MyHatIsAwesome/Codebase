/*
 * Sliding menu
 * ============
 * version: 0.6 beta
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
		content_selector: "",
		button: $([]),
		button_selector: "",
		overlay: $([]),
		overlay_selector: "",
		position: 'left',
		stime: 200,
		ssize: 250,
		open: false,
		close: true,
		is_open: false,
		animating:false,
		onClose:function(){},
		onOpen:function(){}
	}, // end defaults

	setDefaults: function( settings ) {
		$.extend( $.slidemenu.defaults, settings );
		return this;
	},

	prototype: {

		init: function() {

			// initialise
			this.style_objects();
			this.trigger_events();

			//console.log('%c slidingmenu (' + this.settings.position + ') : %c initialized ', 'background-color:#333; color:lightgrey; border-radius:3px;', 'margin-left:10px; background-color:#333; color:lightgreen; border-radius:3px;');
			return this;
		},

		toggle_state: function(){
			if (this.menu.hasClass('closed'))
				this.slide('open');
			else
				this.slide('close');

			return this;
		},

		slide: function (action, time) {
			time = time || this.settings.stime;
			var left = 0;
			if( action === "open" )
				if( this.settings.position === "left" )
					left = this.settings.ssize;
				else
					left = -this.settings.ssize;

			if(left !== 0) {
				this.settings.overlay.fadeIn('fast');
				this.menu.removeClass('closed');
			}

			this.settings.animating = true;
			this.settings.content.animate({'left':left}, time, 'swing', (function(){
				this.settings.animating = false;

				if (left === 0)
				{
					if( this.settings.overlay.is(":visible") )
						this.settings.overlay.fadeOut('fast');

					this.menu.addClass('closed');
					this.settings.is_open = false;
					this.settings.onClose(this);
				}
				else
				{
					this.settings.is_open = true;
					this.settings.onOpen(this);
				}

				return false;
			}).bind(this));
			return this;
		},

		slideopen: function( time ){ this.slide('open', time); return this; },

		slideclose: function( time ){ this.slide('close', time); return this; },

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
			return this;
		},

		rebind_events: function(){
			if( this.settings.button_selector ) this.settings.button = $(this.settings.button_selector);
			if( this.settings.content_selector ) this.settings.content = $(this.settings.content_selector);
			if( this.settings.overlay_selector ) this.settings.overlay = $(this.settings.overlay_selector);

			this.settings.button.off("click").on("click", (function(e){
				this.toggle_state();
				return false;
			}).bind(this) );

			this.settings.overlay.on("click", (function(e){
				if ( !this.settings.animating && this.settings.is_open )
					this.slideclose();
				return false;
			}).bind(this) );
			return this;
		},

		trigger_events: function(){
			this.slideclose();
			this.rebind_events();

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
			return this;

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