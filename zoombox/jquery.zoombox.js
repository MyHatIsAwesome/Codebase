/*
	A simle to use zoom box for showing high resolution previews of an image.
	When you hover your mouse over a thumbnail a box will appear and load in
	the high res version.


	Author: J.A.Westwood

*/



(function($){

$.ZoomBox = function(options){
	this.settings = $.extend(true, {}, $.ZoomBox.defaults, options)

	// internal variables not to do with configuration
	this.container = $("."+this.settings.container_class)
	this.thumbnail = $([])
	this.full_image = $([])
	this.mouse_x = 0
	this.mouse_y = 0
	this.hover_timeout = 0

	this.init()
	return this
}

$.extend($.ZoomBox, {

	defaults: {
		// The class that matches your thumbnail elements
		thumb_class: "thumb",

		// The class that matches the container for the high res image.
		// If the container does not already exist in the page, one will be created and appended to <body>
		container_class: "zoom-container",

		// The class that the thumbnail tracking rectangle has
		track_class: "zoom-track",

		// class to apply to the zoom container while it is loading an image
		// you can use this class to apply a loading wheel background image for example
		loading_class: "loading",

		// the attribute on your thumbnails that points to the high resolution image
		// you want to use in the zoom. Eg: <img src='thumb.jpg' data-zoom='highres.jpg'/>
		src_attribute: "data-zoom",

		// time in milliseconds between hovering over a thumbnail and the zoom box appearing
		delay: 500,

		// time in milliseconds to fade the zoom container in and out
		fade_in_time: 300,
		fade_out_time: 200,

		// whether or not to display the tracking rectangle over the thumbnail when zoom is
		// visible
		show_track: true,

		// the width and height of the zoom container
		// Does not apply when you specify your own zoom container
		container_width: 300,
		container_height: 300,

		// Determins whether or not the zoom container is automatically positioned
		// set to true if you want the zoom box to be in a fixed position
		// set to false to automatically position the zoom box next to the thumbnail
		// If unset and the zoom container is automatically generated, then this will default to False
		// otherwise if the zoom container does exist, then this will default to True.
		fixed_container: null,

		// the z-index value to apply to the zoom container
		// set higher if the zoom appears behind things
		zindex: 1337,

		// a callback fired after the zoom container is shown
		on_zoom_start: function(){},

		// a callback fired after the zoom container is hidden
		on_zoom_end: function(){}
	},

	prototype:{
		init:function(){
			// check a container has been set otherwise create a container for
			// the zoom and append it to the page body
			if( this.container.length == 0 )
			{
				this.container = $("<div />")
					.addClass(this.settings.container_class)
					.css({
						"position": "absolute",
						"display": "none",
						"overflow": "hidden",
						"width": this.settings.container_width+"px",
						"height": this.settings.container_height+"px",
						"z-index": this.settings.zindex
					})
				$("body").append(this.container)

				// indicate that the zoom container should be positioned automatically
				if( this.settings.fixed_container === null )
					this.settings.fixed_container = false
			}
			else
			{
				this.container.css({
					"position":"absolute",
					"z-index":this.settings.zindex,
					"overflow":"hidden"
				})

				// indicate that the zoom container has fixed position
				if( this.settings.fixed_container === null )
					this.settings.fixed_container = true
			}

			this.refresh()
			return this
		},

		position_container:function(){
			// position the container panel next to the thumbnail
			var cont_w = this.container.width(),
				cont_h = this.container.height(),
				thumb = this.thumbnail.offset() || {left:0,top:0},
				thumb_w = this.thumbnail.width(),
				thumb_h = this.thumbnail.height(),
				scroll_y = $(document).scrollTop(),
				screen_h = $(window).height()

			// position right of the thumbnail with 10px padding, center vertically
			var left = thumb.left + thumb_w + 10
			var top = thumb.top + thumb_h/2 - cont_h/2

			// clamp the top value so it stays within the screen
			top = Math.min( Math.max(top, scroll_y+10), scroll_y+screen_h-cont_h-10 )

			// if going off the right of the screen, position left of the thumbnail
			if( left + cont_w > $(window).width() )
				left = thumb.left - cont_w - 10

			this.container.css({
				left:left,
				top:top
			})
		},

		position_image:function(){
			var $full = $(this.full_image)
			if( ! $full.length )
				return

				// get the widths and heights of the thumbnail, full image and zoom container
			var	thumb_w = this.thumbnail.width(),
				thumb_h = this.thumbnail.height(),
				full_w = $full.width(),
				full_h = $full.height(),
				cont_w = this.container.width(),
				cont_h = this.container.height(),

				// calculate the level of zoom of the image relative to the zoom container
				zoom_x = full_w / cont_w,
				zoom_y = full_h / cont_h,

				// calculate the bounds of a rectangle that overlays the thumbnail
				// this rectangle is centered around the mouse pointer and represents
				// the region of the full image visible inside the zoom container
				track_w = thumb_w / zoom_x,
				track_h = thumb_h / zoom_y,
				track_x = Math.clamp( this.mouse_x-(track_w/2), 0, thumb_w-track_w ),
				track_y = Math.clamp( this.mouse_y-(track_h/2), 0, thumb_h-track_h )

			// reposition the full image within the zoom container to mirror the track rectangle
			$full.css({
				left: -(track_x / thumb_w) * full_w,
				top: -(track_y / thumb_h) * full_h
			})

			if( this.settings.show_track )
			{
				this.track.css({
					left: track_x,
					top: track_y,
					width: track_w,
					height: track_h
				})
			}
		},

		refresh:function(){
			var zoom = this

			$("."+zoom.settings.thumb_class).each(function(){

				// ensure the thumbnail can contain absolute positioned children
				if( ! $(this).css("position").match(/absolute|fixed|relative/) )
					$(this).css("position", "relative")

				// create the zoom track elements
				if( ! $("."+zoom.settings.track_class, this).length )
					$("<div/>")
						.addClass(zoom.settings.track_class)
						.css({
							"position":"absolute",
							"left":0,
							"top":0
						})
						.appendTo($(this))

				// mouse enter
				$(this)
				.off("mouseenter.zoom")
				.off("mouseleave.zoom")
				.off("mousemove.zoom")
				.on("mouseenter.zoom", function(){

					zoom.thumbnail = $(this)
					zoom.track = $("."+zoom.settings.track_class, this)

					zoom.hover_timeout = setTimeout(function(){
						// populate the popup container with the full sized image and display it
						var full_src = $(this).attr(zoom.settings.src_attribute) || $(this).attr("src") || ""

						// put container in loading state
						zoom.container
							.empty()
							.addClass(zoom.settings.loading_class)
							.fadeIn({duration:zoom.settings.fade_in_time, queue:false})

						// show the tracking rectangle
						if( zoom.settings.show_track )
							zoom.track.fadeIn({duration: zoom.settings.fade_in_time, queue:false})

						// create full sized image
						var $img = $("<img />")
						zoom.full_image = $img[0]

						$img.attr("src", full_src)
							.css({
								"position":"absolute",
								"max-width":"initial"
							})
							.fadeTo(0, 0)
							.one("load", function(){
								if( zoom.full_image != this )
									return

								$(this).fadeTo(zoom.settings.fade_in_time, 1)
								zoom.container
									.empty()
									.append($(this))
									.removeClass(zoom.settings.loading_class)
								zoom.position_image()
							})

						if( !zoom.settings.fixed_container )
							zoom.position_container()

						// call zoom start callback
						zoom.settings.on_zoom_start.call(zoom, this, zoom.container)
					}.bind(this), zoom.settings.delay) // end timeout

				})
				.on( "mouseleave.zoom", function(){
					clearTimeout(zoom.hover_timeout)
					zoom.container.add(zoom.track).fadeOut({duration: zoom.settings.fade_out_time, queue:false})


					// call zoom start callback
					zoom.settings.on_zoom_end.call(zoom, this, zoom.container)

				})
				.on( "mousemove.zoom", function(e){
					// define shedloads of parameters for the calculation that follows
					var thumb_offset = $(this).offset()
					zoom.mouse_x = e.pageX - thumb_offset.left
					zoom.mouse_y = e.pageY - thumb_offset.top

					zoom.position_image()
				})
				// end mousemove
			})
			// end each

			return this
		} // end function refresh

	} // end prototype
})// end $.extend

})(jQuery)

// returns value clamped between min and max
Math.clamp = function(value, min, max){
	if( min > max )
	{
		var t = min
		min = max
		max = t
	}
	return Math.min( Math.max(value, min), max )
}