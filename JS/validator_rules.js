// 
// Name:	ukPhone
// Author: 	jwestwood
// Desc: 	Validates a UK landline or mobile telephone number
//
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

//
// Name: 	minAge
// Author: 	jwestwood
// Desc: 	Checks that a date in the format YYYY-MM-DD is at least X years old
//
$.validator.addMethod(
	"minAge",
	function(value, el, min){
		if( value.length )
		{
			var now = new Date(), bday = new Date(value);
			var age = ( now - bday ) / 31557600000;
			console.log(now, bday, age);
			return age >= parseInt(min);
		}
		else
			return true;
	},
	"You are not old enough"
);

// 
// Name: 	website
// Author: 	jwestwood
// Desc: 	Validates a website url allowing filepaths, subdomains, querystring and optional http/https protocol
//
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

//
// Name: 	ukPostcode
// Author: 	jwestwood
// Desc: 	Validates a UK postcode according to the format standard, spaces and lowercase permitted
//
$.validator.addMethod(
	"ukPostcode",
	function(value, el, param){
		// uppercase
		value = value.toUpperCase();
		switch( value.replace(/\s+/g, '').length )
		{
			// don't fail on empty postcodes (use required:true if they are required)
			case 0: return true;

			// A9 9AA
			case 5: return /^[A-Z]\d ?\d[A-Z][A-Z]$/.test(value);

			// A9A 9AA  or  A99 9AA  or  AA9 9AA
			case 6: return /^[A-Z][A-Z\d][A-Z\d] \d[A-Z][A-Z]$/.test(value);

			// AA9A 9AA  or  AA99 9AA
			case 7: return /^[A-Z][A-Z]\d[A-Z\d] ?\d[A-Z][A-Z]$/.test(value);

			default: return false;
		}
	},
	"Please enter a valid UK postcode"
);