/**
 * Example 1
 */

;
(function () {
	'use strict';
	
	const path = new PathFollower({
		id: 'example-1',
		imgUrl: 'red_circle.png',
		pickOnClick: true,
		pickerWidth: 14
	});

	document.querySelector('button').onclick = function () {
	    path.moveToNextPoint();
	}

})();