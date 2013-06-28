(function($){

/**
 * Applies a radial blur effect to the selected elements. If applying to images wait until the window load event.
 * @param  {Object} options the settings for the radial blur effect, see the example for a list of settings
 * @example
 * // Possible options, the default values are shown
 * {
 *   on: true,			// whether or not the effect is applied
 *   radius: 10, 		// the radius of the blur effect in pixels
 *   fragments: 8, // The number of fragments in the blur
 *   clockwise: true 	// The direction the fragments are drawn
 * }
 */
$.fn.radialblur = function(options){
	if( !this.length && window.console ){
		console.warn("radialblur: Cannot apply radial blur, nothing selected")
		return
	}

	// check if a radialblur for this element exists
	var radialblur = $.data( this[0], "radialblur" )
	if ( radialblur )
		return radialblur

	radialblur = new $.radialblur( options, this[0] )
	$.data( this[0], "radialblur", radialblur )

	return radialblur
}

/**
 * Creates a new radialblur object
 * @class radialblur
 * @classdesc radialblur objects maintain the state of the blur effect, when radialblur() is called on a jquery selector a radialblur object is created and stored. Subsequent calls on the same selector will return the same radialblur object, which can be manipulated to control the blur effect.
 * @param  {Object} options settings for the blur effect
 * @param  {Element} element a HTML element to apply the blur effect to
 */
$.radialblur = function(options, element){
	this.settings = $.extend( true, {}, $.radialblur.defaults, options )
	this.$el = $(element)
	this.frags = []
	this.init()
}

$.extend($.radialblur, {
	defaults: {
		on:true,
		radius:10,
		fragments:8,
		clockwise:true
	},

	/**
	 * @lends radialblur
	 */
	prototype: {

		/**
		 * Initialises the blur by simply calling create_fragments()
		 */
		init:function(){
			this.create_fragments()
			return this
		},

		/**
		 * generates the fragments by cloning the original element
		 */
		create_fragments:function(){
			if( this.frags.length > 1 )
				for( var i=1; i<this.frags.length; i++ )
					this.frags[i].remove()

			this.frags = [this.$el]
			for( var i=1; i<this.settings.fragments; i++ )
			{
				this.frags[i] = this.$el.clone()

				if( this.settings.clockwise )
					this.frags[i].insertAfter(this.$el)
				else
					this.frags[i].insertBefore(this.$el)
			}

			for( var i=0; i<this.frags.length; i++ )
			{
				this.frags[i].css({
					position:"absolute",
					left:0, top:0, opacity:1
				})
			}

			this.$el.parent().css("position","relative")
			this.apply()

			return this
		},

		/**
		 * Applies the blur with its current settings
		 */
		apply:function(){

			// calculate the center of the container
			var cx = this.$el.parent().innerWidth()/2 - this.$el.outerWidth()/2
			var cy = this.$el.parent().innerHeight()/2 - this.$el.outerHeight()/2

			//////////////////////
			// Turn on the blur //
			//////////////////////
			if( this.settings.on )
			{
				// opacity for each fragment is inversely proportional to the number of fragments
				var opacity = 1.5 / this.settings.fragments

				// calculate and apply the position of each fragment
				for( var i=1; i<=this.frags.length; i++ )
				{
					var x = cx
					var y = cy

					if( this.settings.fragments > 1 )
					{
						// standard point-on-circle-given-angle formula
						var x = cx + this.settings.radius * Math.cos( 2 * Math.PI * i / this.settings.fragments )
						var y = cy + this.settings.radius * Math.sin( 2 * Math.PI * i / this.settings.fragments )
					}

					this.frags[i-1].css({
						opacity: opacity,
						left: x+"px",
						top: y+"px",
						position: "absolute"
					}).show()
				}
			}
			///////////////////////
			// Turn off the blur //
			///////////////////////
			else
			{
				// hide all but the original fragment
				for( var i=1; i<this.frags.length; i++ )
					this.frags[i].hide()

				// position the fragment in the center
				this.$el.css({
					opacity:1,
					left: cx+"px",
					top: cy+"px",
					position: "absolute"
				}).show()
			}

			return this
		},

		/**
		 * Gets or Sets the number of fragments in the blur, when setting the fragments are regenerated.
		 * @param  {number} n number of fragments
		 * @return {number|radialblur}
		 */
		fragments:function(n){
			if( n === undefined )
			{
				return this.settings.fragments
			}
			else
			{
				n = Number(n)
				if( n === NaN )
					throw "Blarrgharrgharghargh"
				else
				{
					this.settings.fragments = n
					this.create_fragments()
				}

				return this
			}
		},

		/**
		 * Gets or Sets the radius of the blur, when setting apply() is called.
		 * @param  {number} n radius of the blur
		 * @return {number|radialblur}
		 */
		radius:function(r){
			if( r === undefined )
			{
				return this.settings.radius
			}
			else
			{
				r = Number(r)
				if( r === NaN )
					throw "Blarrgharrgharghargh"
				else
				{
					this.settings.radius = r
					this.apply()
				}

				return this
			}
		},

		/**
		 * Gets or Sets the clockwise property of the blur, when setting the fragments are regenerated.
		 * @param  {boolean} true:clockwise, false:anticlockwise
		 */
		clockwise:function(b)
		{
			if( b === undefined )
			{
				return this.settings.clockwise
			}
			else
			{
				this.settings.clockwise = b ? true : false
				this.create_fragments()
				return this;
			}

		},

		/**
		 * @return {boolean} Whether or not the effect is currently on
		 */
		is_on:function()
		{
			return this.settings.on
		},

		/**
		 * Turns on the blur effect
		 */
		on:function()
		{
			this.settings.on = true
			this.apply()
			return this
		},

		/**
		 * Turns off the blur effect
		 */
		off:function()
		{
			this.settings.off = true
			this.apply()
			return this
		}
	}
})

})(jQuery)