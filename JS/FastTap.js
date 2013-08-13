/*
	Blarghaaargharghargh

	#1 - get yoself a dom element or whatever
	#2 - do this:
		FastTap( element, function( touchend_event ){
			// do stuff
		})

		or this:
		FastTap( element ) // with no handler the click event is simply fired
 */
var FastTap = (function($)
{

	function FastTap(element, handler)
	{

		if (!(this instanceof FastTap))
			return new FastTap(element, handler)

		this.element = $(element)
		if (this.element.length == 0)
			return

		if( handler && typeof(handler) !== "function")
			throw new TypeError("FastTap - argument #2 the provided handler is not a function!")

		this.handler = handler
		this.init()
	}
	$.extend(FastTap.prototype,
	{

		init: function()
		{
			this.x = 0
			this.y = 0
			this.primed = false

			// listen for touch events
			this.element
				.off("touchstart.ftap touchend.ftap touchmove.ftap click.ftap")
				.on("touchstart.ftap", this.touchstart.bind(this))
				.on("touchend.ftap", this.touchend.bind(this))
				.on("touchmove.ftap", this.touchmove.bind(this))
				.on("click.ftap", this.click.bind(this))
		},

		touchstart: function(e)
		{
			this.x = e.originalEvent.touches[0].clientX
			this.y = e.originalEvent.touches[0].clientY
			this.primed = true
		},

		touchend: function(e)
		{
			if (this.primed)
			{
				this.primed = false
				this.stomp_click = true
				this.fire(e)
			}
		},

		touchmove: function(e)
		{
			// if they move their 'finger' more than 16 pixels radially away from the position
			// the touch started, then they are probably dragging rather than tapping, so dont
			// fire the click event when they release
			if (this.primed)
			{
				var x = e.originalEvent.touches[0].clientX
				var y = e.originalEvent.touches[0].clientY
				var distance = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2))

				if (distance > 14)
					this.primed = false
			}
		},

		click: function(e)
		{
			if (!this.stomp_click)
			{
				this.stomp_click = false
				this.fire(e)
			}
		},

		fire: function( e )
		{
			if( this.handler )
			{
				this.handler.call(e.currentTarget, e)
			}
			else
			{
				e.currentTarget.click()
			}
		}
	})

	$.fn.fastTap = function( handler ){
		var ft = new FastTap( this, handler )
		if( ft )
			this.data("fastTap", ft)

		return this
	}


	return FastTap
})(jQuery)