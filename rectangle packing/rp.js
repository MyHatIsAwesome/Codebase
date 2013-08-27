var colours = [ "#ffaaaa", "#aaffaa", "#aaaaff", "#aaffff", "#ffaaff", "#ffffaa" ]
var min = 50
var max = 200
var count = 20
var rectangles = []

function Rect(x, y, w, h, col){
	this.x = x
	this.y = y
	this.w = w
	this.h = h

	this.e = $("<div/>").css("background",col)
	this.apply()
}
Rect.prototype.apply = function(){
	this.e.css({
		left:this.x+"px",
		top:this.y+"px",
		width:this.w+"px",
		height:this.h+"px"
	})
}

function Set( grid, row, col, row_span, col_span )
{
	this.grid = grid
	this.row = row || 0
	this.col = col || 0
	this.row_span = row_span || 1
	this.col_span = col_span || 1
}
Set.prototype = {
	constructor: Set,

	width: function(){
		var width = 0
		for( var i=0; i<this.col_span; i++ )
			width += this.grid.cols[this.col+i]
		return width
	},

	height: function(){
		var height = 0
		for( var i=0; i<this.row_span; i++ )
			height += this.grid.rows[this.row+i]
		return height
	},

	expand_width: function(){
		// cannot widen if the set includes the last column in the grid
		var col = this.col+this.col_span
		if( col >= this.grid.cols.length )
			return false

		// test all the cells in the new column for any that are occupied
		for( var i=0; i<this.row_span; i++ )
			if( this.grid.cells[this.row+i][col] )
				return false

		// expanded cells free, include them in the set
		this.col_span++
		return true
	},

	expand_height: function(){
		// cannot widen if the set includes the last row in the grid
		var row = this.row+this.row_span
		if( this.row + this.row_span >= this.grid.rows.length-1 )
			return false

		// test all the cells in the new column for any that are occupied
		for( var i=0; i<this.col_span; i++ )
			if( this.grid.cells[row][this.col+i] )
				return false

		// expanded cells free, include them in the set
		this.row_span++
		return true
	},

	move_cols: function( n ){
		var col = this.col+n
		if( col+this.col_span >= this.grid.cols.length || col < 0 )
			return false

		this.col = col
		return true
	},

	move_rows: function( n ){
		var row = this.row+n
		if( row+this.row_span >= this.grid.rows.length || row < 0 )
			return false

		this.row = row
		return true
	},

	fits: function( rect ){
		return this.width() >= rect.w && this.height() >= rect.h
	}
}


function Grid( width, height )
{
	this.cells = [ [false] ]
	this.rows = [ height ]
	this.cols = [ width ]
}
Grid.prototype = {
	constructor: Grid,

	fit: function( rect ){

		// Iterate through every cell in the grid
		// at each cell creating a 1x1 set of cells and expanding it until
		// the rectangle fits inside, or the set can't be expanded any more without
		// already occupied space
		rows:
		for( var row=0; row<this.rows.length; row++ )
		{
			cols:
			for( var col=0; col<this.cols.length; col++ )
			{
				// if the cell is free
				if( ! this.cells[row][col] )
				{
					// create a new set
					var set = new Set(this, row, col, 1, 1)
					while( !set.fits( rect ) )
					{
						// expand the width if it is too narrow
						// if the width cannot be expanded then abandon this position
						// and try again starting from the next column
						if( set.width() < rect.w )
							if( ! set.expand_width() )
								continue cols

						// same for height
						if( set.height() < rect.h )
							if( ! set.expand_height() )
								continue cols
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
						this.cols[last_col] -= excess_width

						// then insert a new column with the amount excess
						this.cols.splice(last_col+1, 0, excess_width)

						// insert a new column into every row in the cells grid too
						// the new cell should inherit the 'occupied' state of the cell
						// being split
						for( var i=0; i<this.rows.length; i++ )
							this.cells[i].splice(last_col+1, 0, this.cells[i][last_col])
					}

					if( excess_height > 0 )
					{
						// shrink the last row by the amount of excess
						this.rows[last_row] -= excess_height

						// then insert a new row with the amount excess
						this.rows.splice(last_row+1, 0, excess_height)

						// insert a new row into the cells grid too
						// the occupied status of each cell in the new row
						// should be the same as the row being split
						var row_copy = this.cells[last_row].slice(0)
						this.cells.splice( last_row+1, 0, row_copy )
					}


					// At this point the new rows and columns have been inserted
					// Next the cells being occupied by the new rectangle need to
					// be set as occupied
					for( var r=set.row; r<set.row+set.row_span; r++ )
						for( var c=set.col; c<set.col+set.col_span; c++ )
							this.cells[r][c] = true


					// Now update the XY position of the rectangle
					var x = 0, y = 0
					for( var c=0; c<set.col; c++ ) x += this.cols[c]
					for( var r=0; r<set.row; r++ ) y += this.rows[r]

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
}

$(window).load(function(){
	window.section = $("section")

	$("#another").click(function(){
		create_rectangle()
		packem()
	}).click()

})

function packem(){

	rectangles = quicksort( rectangles, function(a,b){ return (a.w+a.h) - (b.w+b.h); } )

	// Create a grid
	window.grid = new Grid( section.width(), section.height() )

	for( var i=0, rect; rect=rectangles[i]; i++ )
	{
		if( grid.fit( rect ) ){
			rect.apply()
		} else {
			rect.e.remove()
		}
	}

	draw_canvas()
}

function create_rectangle(){
	var rect = new Rect(
			Math.floor( Math.random() * ($(window).width() - max - 20) ),
			Math.floor( Math.random() * ($(window).height() - max - 100) ),
			Math.floor( min + Math.random() * (max-min) ),
			Math.floor( min + Math.random() * (max-min) ),
			colours[rectangles.length%colours.length]
		)
	section.append(rect.e)
	rectangles.push(rect)
	return rect
}

function quicksort( array, compare )
{
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

	return quicksort(less, compare).concat( pivot_item ).concat( quicksort(more, compare) )
}

function draw_canvas()
{
	var canvas = document.getElementById("canvas")
	canvas.width = section.width()
	canvas.height = section.height()

	var ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	for( var row=0, y=0; row<grid.rows.length; row++ )
	{
		y += grid.rows[row]
		ctx.beginPath()
		ctx.moveTo(0, y)
		ctx.lineTo( canvas.width, y )
		ctx.lineWidth = 1
		ctx.stroke()

		for( var col=0, x=0; col<grid.cols.length; col++ )
		{
			x += grid.cols[col]
			ctx.beginPath()
			ctx.moveTo(x, 0)
			ctx.lineTo(x, canvas.height)
			ctx.lineWidth = 1
			ctx.stroke()
		}
	}
}