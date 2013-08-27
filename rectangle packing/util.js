function Rect(x, y, w, h, col){
	this.x = x
	this.y = y
	this.w = w
	this.h = h

	col = col || Rect.colours[Math.floor( Math.random()*Rect.colours.length )]
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

	if( this.label )
		this.e.text( this.label )
}
Rect.colours = [ "#ffaaaa", "#aaffaa", "#aaaaff", "#aaffff", "#ffaaff", "#ffffaa" ]
Rect.min_w = 50
Rect.min_h = 50
Rect.max_w = 200
Rect.max_h = 200
Rect.random = function( min_w, min_h, max_w, max_h )
{
	min_w = min_w || Rect.min_w
	min_h = min_h || Rect.min_h
	max_w = max_w || Rect.max_w
	max_h = max_h || Rect.max_h

	var rect = new Rect( 0, 0,
		Math.floor( min_w + Math.random() * (max_w-min_w) ),
		Math.floor( min_h + Math.random() * (max_h-min_h) )
	)
	return rect
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