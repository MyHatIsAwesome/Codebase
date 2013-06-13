$.validator.addMethod(
	"ukPhone",
	function(value, element){
		if( value.length )
			return	/^(\+44|0|00|044|0044)(1|2|7)(\d\s?){9}$/.test(value.replace(/\s+/g, ''));
		else
			return true;
	},
	"Please enter a valid UK phone number"
);

// requires ISO date YYYY-MM-DD
$.validator.addMethod(
	"minAge",
	function(value, el, min){
		if( value.length )
		{
			var now = new Date(), bday = new Date(value);
			var age = ( now - bday ) / 31557600000;
			return age >= parseInt(min);
		}
		else
			return true;
	},
	"You are not old enough"
);

$.validator.addMethod(
	"website",
	function(value, el, param){
		if( value.length )
			return	/^(https?:\/\/)?([\w][\w-]*\.)+[a-zA-Z][\w-]*\.?\/?[\w- ;,\.\/\?%&=#'"]*$/.test(value);
		else
			return true;
	},
	"Please enter a valid web address"
);

$.validator.addMethod(
	"ukPostcode",
	function(value, el, allow_half){

		// uppercase
		value = value.toUpperCase();
		switch( value.replace(/\s+/g, '').length )
		{
			// don't fail on empty postcodes (use required:true if they are required)
			case 0: return true;

			// A9
			case 2: return allow_half && /^[A-Z]\d ?$/.test(value);

			// A9A
			case 3: return allow_half && /^[A-Z][A-Z\d][A-Z\d] ?$/.test(value);

			// AA9A
			case 4: return allow_half && /^[A-Z][A-Z]\d[A-Z\d] ?$/.test(value);

			// A9 9AA
			case 5: return /^[A-Z]\d ?\d[A-Z][A-Z]$/.test(value);

			// A9A 9AA  or  A99 9AA  or  AA9 9AA
			case 6: return /^[A-Z][A-Z\d][A-Z\d] ?\d[A-Z][A-Z]$/.test(value);

			// AA9A 9AA  or  AA99 9AA
			case 7: return /^[A-Z][A-Z]\d[A-Z\d] ?\d[A-Z][A-Z]$/.test(value);

			default: return false;
		}
	},
	"Please enter a valid UK postcode"
);