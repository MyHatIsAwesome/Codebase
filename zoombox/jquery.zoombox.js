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
	this.$box = $("."+this.settings.box_class)
	this.$image = $([])
	this.$thumbnail = $([])
	this.$track = $([])
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
		box_class: "zoom-box",

		// Set this if you want to use a separate container for the zoom image rather than the
		// main container.
		image_container_class: null,

		// class to apply to the image element within the zoom box for styling purposes
		image_class: "zoom-image",

		// The class that the thumbnail tracking rectangle has
		track_class: "zoom-track",

		// class to apply to the zoom container while it is loading an image
		// you can use this class to apply a loading wheel background image for example
		loading_class: "loading",

		// the attribute on your thumbnails that points to the high resolution image
		// you want to use in the zoom. Eg: <img src='thumb.jpg' data-highres='highres.jpg'/>
		src_attribute: "data-highres",

		// the attribute on your thumbnails that you use to override the scale of an image
		// the scale is proportional to the size of the thumbnail, eg. data-scale="2" will
		// show a zoomed image twice the size of the thumbnail
		scale_attribute: "data-scale",

		// time in milliseconds between hovering over a thumbnail and the zoom box appearing
		delay: 500,

		// time in milliseconds to fade the zoom container in and out
		fade_in_time: 300,
		fade_out_time: 200,

		// whether or not to display the tracking rectangle over the thumbnail when zoom is
		// visible
		show_track: true,

		// set true if you want the zoomed image to be applied as a background image rather than
		// an <img> element
		use_css_background: false,

		// the width and height of the zoom container
		// Does not apply when you specify your own zoom container
		box_width: 300,
		box_height: 300,

		// Preferred place to position zoom container
		// right | left | top | bottom
		box_position: "right",

		// if the preferred position does not fit the zoom container
		// should the other directions be tried?
		keep_in_screen: true,

		// space to add between the thumbnail and the zoom container when positioning
		// it automatically
		box_margin: 10,

		// easing function to use for fade animations
		fade_easing: "linear",

		// Determins whether or not the zoom container is automatically positioned
		// set to true if you want the zoom box to be in a fixed position
		// set to false to automatically position the zoom box next to the thumbnail
		// If unset and the zoom container is automatically generated, then this will default to False
		// otherwise if the zoom container does exist, then this will default to True.
		fixed: null,

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

			if( this.settings.fixed === null )
				this.settings.fixed = this.$box.length == 0

			this.refresh_box()
			this.refresh_image_container()

			this.refresh()
			return this
		},

		refresh_box: function(){
			if( this.$box.length == 0 )
				this.$box = $("<div />")
			this.box = this.$box[0]

			// initial styles
			this.$box
				.css({
					"min-width": this.settings.box_width+"px",
					"min-height": this.settings.box_height+"px",
					"z-index": this.settings.zindex,
					"overflow": "hidden"
				})
				.addClass(this.settings.box_class)
				.hide()

			// ensure fixed containers are position relative
			// and dynamically positioned containers are position absolute
			if( ! this.$box.css("position").match(/absolute|fixed|relative/) )
				if( this.settings.fixed )
					this.$box.css("position", "relative")
				else
					this.$box.css("position", "absolute")

			// append dynamically positioned containers to the body
			if( this.settings.fixed === false )
				this.$box.appendTo("body")
		},

		refresh_image_container: function(){
			if( this.settings.image_container_class )
			{
				var $image_container = $("."+this.settings.image_container_class, this.box)
				if( $image_container.length == 0 )
				{
					$image_container = $("<div/>")
						.addClass(this.settings.image_container_class)
				}

				this.$image_container = $image_container.appendTo(this.box)
			}
			else
			{
				this.$image_container = this.$box
			}
		},

		// positions the container panel next to the thumbnail
		position_container:function(){
			// ensure the container is the correct size in case it has been changed
			// also don't let the container be larger than the image it contains
			if( this.image )
			{
				var full_w = this.image.width || Infinity
				var full_h = this.image.height || Infinity
				this.$box.css({
					"min-width": Math.min(this.settings.box_width, full_w)+"px",
					"min-height": Math.min(this.settings.box_height, full_h)+"px",
					"z-index": parseInt(this.settings.zindex) || 0
				})
			}

			var cont_w = this.$box.width(),
				cont_h = this.$box.height(),
				thumb = this.$thumbnail.offset() || {left:0,top:0},
				thumb_w = this.$thumbnail.width(),
				thumb_h = this.$thumbnail.height(),
				scroll_x = $(document).scrollLeft(),
				scroll_y = $(document).scrollTop(),
				screen_w = $(window).width(),
				screen_h = $(window).height(),
				margin = parseInt( this.settings.box_margin ) || 0,
				direction = this.settings.box_position

			// Try preferred position first
			var xy = calculate_position( direction )

			// if the zoombox is set to try other directions when the box cannot fit
			if( this.settings.keep_in_screen &&
				is_out_of_bounds( direction, xy[0], xy[1] ) )
			{
				// get the opposite direction of the preferred one
				// this should be attempted first
				var opposite = "left"
				switch( direction )
				{
					case "left":   opposite = "right"; break
					case "top":    opposite = "bottom"; break
					case "bottom": opposite = "top";
				}

				// create an array of each new direction to attempt
				// not including the preferred one already tried
				var directions = [opposite]
				if( opposite === "left" || opposite === "right" )
					directions.push("top", "bottom")
				else
					directions.push("left", "right")

				// try each direction until one fits
				for( var i=0, d; d=directions[i]; i++ )
				{
					var pos = calculate_position(d)
					if( ! is_out_of_bounds(d, pos[0], pos[1]) )
					{
						direction = d
						xy = pos
						break
					}
				}
			}

			// clamp the chosen position so it is not off the edge of the screen
			if( this.settings.keep_in_screen )
				xy = clamp( xy[0], xy[1] )

			// Finally, apply the position to the zoom container
			this.$box.css({
				"left":xy[0],
				"top":xy[1]
			})

			function calculate_position( d ){
				switch( d )
				{
					case "left":
						return [thumb.left - cont_w - margin,
								thumb.top + thumb_h/2 - cont_h/2]
					case "top":
						return [thumb.left + thumb_w/2 - cont_w/2,
								thumb.top - cont_h - margin]
					case "bottom":
						return [thumb.left + thumb_w/2 - cont_w/2,
								thumb.top + thumb_h + margin]
					default: // right
						return [thumb.left + thumb_w + margin,
								thumb.top + thumb_h/2 - cont_h/2]
				}
			}

			function clamp( x, y )
			{
				var left, top
				switch( direction )
				{
					case "top":
					case "bottom":
						left = Math.clamp(x, scroll_x+margin, scroll_x+screen_w-margin-cont_w)
						break

					default:
						top = Math.clamp(y, scroll_y+margin, scroll_y+screen_h-margin-cont_h)
				}

				switch( direction )
				{
					case "left":   return [Math.max( x, scroll_x + margin ), top]
					case "top":    return [left, Math.max(y, scroll_y + margin)]
					case "bottom": return [left, Math.min(y, scroll_y+screen_h-margin-cont_h)]
					default:       return [Math.min( x, scroll_x+screen_w-margin-cont_w), top]
				}
			}

			function is_out_of_bounds( direction, x, y )
			{
				if( direction ==="top" || direction === "bottom" )
					return y < scroll_y || y + cont_h > screen_h + scroll_y
				else
					return x < scroll_x || x + cont_w > screen_w + scroll_x
			}
		},

		position_image:function(){
			var $full = $(this.image)
			if( ! $full.length )
				return

			// get the widths and heights of the thumbnail, full image and zoom container
			var	thumb_w = this.$thumbnail.width(),
				thumb_h = this.$thumbnail.height(),
				full_w = $full.width(),
				full_h = $full.height(),
				cont_w = this.$box.width(),
				cont_h = this.$box.height(),

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
				"left": -(track_x / thumb_w) * full_w,
				"top": -(track_y / thumb_h) * full_h
			})

			// display the track rectangle over the thumbnail
			if( this.settings.show_track )
			{
				this.$track.css({
					"left": track_x,
					"top": track_y,
					"width": track_w,
					"height": track_h
				})
			}
		},

		refresh:function(){
			var zoom = this


			// refresh the thumbnails
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
						.hide()
						.appendTo($(this))

				// Add Event Handlers to the thumbnails
				$(this)
				.off("mouseenter.zoom")
				.off("mouseleave.zoom")
				.off("mousemove.zoom")
				.on("mouseenter.zoom", function(){

					zoom.$thumbnail = $(this)
					zoom.thumbnail = this
					zoom.$track = $("."+zoom.settings.track_class, this)
					zoom.track = zoom.$track[0]

					zoom.hover_timeout = setTimeout(function(){
						// populate the popup container with the full sized image and display it
						var full_src = $(this).attr(zoom.settings.src_attribute) || $(this).attr("src") || ""

						// get rid of the current image
						zoom.$image.remove()

						// put container in loading state
						zoom.$box
							.addClass(zoom.settings.loading_class)
							.fadeIn({
								duration: parseInt(zoom.settings.fade_in_time),
								easing: zoom.settings.fade_easing
							})

						// reposition the zoom container
						if( !zoom.settings.fixed )
							zoom.position_container()

						// create full sized image
						zoom.$image = $("<img />")
							.attr("src", full_src)
							.css({
								"position":"absolute",
								"max-width":"initial"
							})
							.addClass( zoom.settings.image_class )
							.fadeTo(0, 0)
							.one("load", function(e){
								if( zoom.image != this )
									return

								// set the width + height of the image
								var thumb_w = zoom.$thumbnail.width(),
									thumb_h = zoom.$thumbnail.height(),
									scale = parseFloat( zoom.$thumbnail.attr(zoom.settings.scale_attribute) ) || this.width/thumb_w
								$(this).attr({
									"width": Math.floor( thumb_w * scale ),
									"height": Math.floor( thumb_h * scale )
								})

								// show the tracking rectangle
								if( zoom.settings.show_track )
									zoom.$track.fadeIn({
										duration: parseInt(zoom.settings.fade_in_time),
										easing: zoom.settings.fade_easing
									})

								// call zoom start callback
								zoom.settings.on_zoom_start.call(zoom, this, zoom.$box)

								$(this).fadeTo(parseInt(zoom.settings.fade_in_time), 1, zoom.settings.fade_easing)

								zoom.$image_container.prepend(this)
								zoom.$box.removeClass(zoom.settings.loading_class)

								zoom.position_image()
							})
							zoom.image = zoom.$image[0]

					}.bind(this), zoom.settings.delay) // end timeout

				})
				.on( "mouseleave.zoom", function(){
					clearTimeout(zoom.hover_timeout)
					zoom.$box.add(zoom.$track)
						.fadeOut({
							duration: parseInt(zoom.settings.fade_out_time),
							easing: zoom.settings.fade_easing
						})

					// call zoom start callback
					zoom.settings.on_zoom_end.call(zoom, this, zoom.$box)

				})
				.on( "mousemove.zoom", function(e){
					// define shedloads of parameters for the calculation that follows
					var thumb_offset = $(this).offset()
					zoom.mouse_x = e.pageX - thumb_offset.left
					zoom.mouse_y = e.pageY - thumb_offset.top

					zoom.position_image()
				})
			})// end each

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