function Packer( width, height, rects ){
	this.rects = rects
	this.cells = [ [false] ]
	this.rows = [ height ]
	this.cols = [ width ]
}

Packer.prototype.pack_rect = function( rect )
{
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

Packer.prototype.pack = function(){
	var rects = this.quicksort( this.rects.slice(0), this.sorter )

	for( var i=0, rect; rect=rects[i]; i++ )
		this.pack_rect(rect)
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