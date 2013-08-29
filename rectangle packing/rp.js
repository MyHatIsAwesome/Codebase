function Canvas( rects ){
	this.rects = rects || []
	this.width = 0xffffffffffff
	this.height = this.width
	this.reset()
}
Canvas.prototype = {
	constructor: Canvas,
	occupied_width: function(){
		var n = 0
		for( var i=0, col_w; col_w=this.cols[i]; i++ )
			n += col_w
		return n
	},

	occupied_height: function(){
		var n = 0
		for( var i=0, row_h; row_h=this.rows[i]; i++ )
			n += row_h
		return n
	},

	set_width: function( n ){
		this.width = n
		this.cols[0] = n
	},

	set_height: function( n ){
		this.height = n
		this.rows[0] = n
	},

	reset: function(){
		this.cells = [[false]]
		this.rows = [ this.height ]
		this.cols = [ this.width ]
	},

	clone: function(){
		var clone = new Canvas()

		clone.width = this.width
		clone.height = this.height
		clone.rows = this.rows.slice(0)
		clone.cols = this.cols.slice(0)
		for( var i=0, rect; rect=this.rects[i]; i++ )
			clone.rects.push(rect.clone())

		clone.cells = []
		for( var row = 0 ; row < this.cells.length; row++ )
			clone.cells[row] = this.cells[row].slice(0)

		return clone
	},

	calculate_wasted_area: function(){
		var rect_area = 0
		for( var i=0, rect; rect=this.rects[i]; i++ )
			rect_area += rect.w*rect.h

		return (this.width * this.height) - rect_area
	},

	calculate_wasted_fraction: function(){
		return this.calculate_wasted_area() / (this.width*this.height)
	}
}

window.pack_count = 0
window.smaller_packs = 0

function Packer(){
	this.canvas = new Canvas()
}

Packer.prototype.find_smallest_enclosing_rectangle = function( rects )
{
	window.pack_count = 0
	window.smaller_packs = 0

	this.canvas = new Canvas( rects )
	// duplicate the rects because quicksort mutates the original array
	rects = rects.slice(0)

	// sort the rects in descending order of height
	rects = this.quicksort( rects, function(a,b){
		return b.h - a.h
	})
	this.canvas.rects = rects

	// find the widest rectangle
	var min_canvas_width = 0
	var smallest_rect_width = Infinity
	for( var i=0, rect; rect=rects[i]; i++ )
	{
		if( rect.w > min_canvas_width )
			min_canvas_width = rect.w

		if( rect.w < smallest_rect_width )
			smallest_rect_width = rect.w
	}

	// set the canvas height to match the tallest rectangle
	this.canvas.set_height( rects[0].h )

	var smallest_canvas = null
	if( this.pack() )
	{
		var initial_width = 0
		for( var c=0; c<this.canvas.cols.length-1; c++ )
			initial_width += this.canvas.cols[c]

		this.canvas.set_width( initial_width )
		smallest_canvas = this.canvas.clone()
	}
	else
		throw new Error("ABANDON SHIP")

	// main loop
	// repeat this until the canvas has been made narrower than the widest rectangle
	while( this.canvas.width > min_canvas_width )
	{
		this.canvas.set_width( this.canvas.width - 1 )

		while( ! this.pack() )
			this.canvas.set_height( this.canvas.height + 1 )

		if( smallest_canvas.width*smallest_canvas.height > this.canvas.width*this.canvas.height )
		{
			smallest_canvas = this.canvas.clone()
			smaller_packs++
		}
	}

	console.log( "Box", smallest_canvas )
	console.log( "pack count", pack_count )
	console.log( "smaller packs found", smaller_packs )

	this.canvas = smallest_canvas
	return smallest_canvas
}

Packer.prototype.pack = function()
{
	this.canvas.reset()
	pack_count++

	for( var i=0, rect; rect=this.canvas.rects[i]; i++ )
		if( ! this.pack_rect( rect ) )
			return false

	return true
}



Packer.prototype.pack_rect = function( rect )
{
	// Iterate through every cell in the grid
	// at each cell creating a 1x1 set of cells and expanding it until
	// the rectangle fits inside, or the set can't be expanded any more without
	// already occupied space
	cols:
	for( var col=0; col<this.canvas.cols.length; col++ )
	{
		rows:
		for( var row=0; row<this.canvas.rows.length; row++ )
		{
			// if the cell is free
			if( ! this.canvas.cells[row][col] )
			{
				// create a new set
				var set = new Set(this.canvas, row, col, 1, 1)
				while( !set.fits( rect ) )
				{
					// expand the width if it is too narrow
					// if the width cannot be expanded then abandon this position
					// and try again starting from the next column
					if( set.width() < rect.w )
						if( ! set.expand_width() )
							continue rows

					// same for height
					if( set.height() < rect.h )
						if( ! set.expand_height() )
							continue rows
				}


				// At this point a free space has been successfully identified
				// next the excess space needs to be trimmed off which will create
				// extra rows and columns in the grid for this excess space
				var excess_width = set.width() - rect.w
				var excess_height = set.height() - rect.h
				var last_col = col + set.col_span -1
				var last_row = row + set.row_span -1

				if( excess_width > 0 )
				{
					// shrink the last column by the amount of excess
					this.canvas.cols[last_col] -= excess_width

					// then insert a new column with the amount excess
					this.canvas.cols.splice(last_col+1, 0, excess_width)

					// insert a new column into every row in the cells grid too
					// the new cell should inherit the 'occupied' state of the cell
					// being split
					for( var i=0; i<this.canvas.rows.length; i++ )
						this.canvas.cells[i].splice(last_col+1, 0, this.canvas.cells[i][last_col])
				}

				if( excess_height > 0 )
				{
					// shrink the last row by the amount of excess
					this.canvas.rows[last_row] -= excess_height

					// then insert a new row with the amount excess
					this.canvas.rows.splice(last_row+1, 0, excess_height)

					// insert a new row into the cells grid too
					// the occupied status of each cell in the new row
					// should be the same as the row being split
					var row_copy = this.canvas.cells[last_row].slice(0)
					this.canvas.cells.splice( last_row+1, 0, row_copy )
				}


				// At this point the new rows and columns have been inserted
				// Next the cells being occupied by the new rectangle need to
				// be set as occupied
				for( var r=set.row; r<set.row+set.row_span; r++ )
					for( var c=set.col; c<set.col+set.col_span; c++ )
						this.canvas.cells[r][c] = true


				// Now update the XY position of the rectangle
				var x = 0, y = 0
				for( var c=0; c<set.col; c++ ) x += this.canvas.cols[c]
				for( var r=0; r<set.row; r++ ) y += this.canvas.rows[r]

				rect.x = x
				rect.y = y

				// Finally return true to indicate that the rectangle was fitted
				// successfully
				return true

			} // end if cell is free
		} // end column loop
	} // end row loop

	// after every spot has been attempted and no space found
	// return false to indicate failure to fit the rectangle
	return false
}

Packer.prototype.sorter = function(a, b){
	return b.w*b.h - a.w*a.h
}

Packer.prototype.quicksort = function( array, compare ){
	if( array.length <= 1 )
		return array

	var pivot = Math.floor( Math.random() * array.length ),
		pivot_item = array.splice(pivot,1)[0],
		less = [],
		more = []

	for( var i=0, item; item=array[i]; i++ )
		if( compare(item, pivot_item) <= 0 )
			less.push(item)
		else
			more.push(item)

	return this.quicksort(less, compare).concat( pivot_item ).concat( this.quicksort(more, compare) )
}