var isChromeExtension = typeof chrome != 'undefined';

var option_groups = [
	[
		['Redirect WaniKani pages to reviews and lessons', 'checkbox'],
		['When first available', 'redirect_i', 'check-i']
	],
	[
		['Reviews & Lessons', 'checkbox'],
		['Sort current level Radicals to the front of the queue', 'sort_rad_i', 'check-i'],
		['Sort current level Kanji to the front of the queue', 'sort_kan', 'check'],
		// ['Sort Burned items to the front of the queue', 'sort_burn_i', 'check-i'],
		['Differentiate meanings and on/kun readings', 'disable_custom_reviews_i', 'check-i']
	],
	[
		['Tofugu Services', 'checkbox'],
		['TextFugu user', 'textfugu', 'check'],
		['EtoEto user', 'etoeto', 'check'],
	],
	[
		['Miscellaneous', 'checkbox'],
		['24 hour format', '12_hours_i', 'check-i'],
	],
	[
		['Userscripts', 'checkbox', 'Additional options created by the WaniKani community'],
		['Collapsable nested quotes on the forums', 'no_collapse_i', 'check-i', ['pankeki', '2752']]
	]
];


/* SAVE */
var saveTimer, savedSucessfully, saved_options;

function waitToCancel() {
	if (saveTimer)
		clearTimeout(saveTimer);
	saveTimer = setTimeout(function() {
		var status = document.getElementById("status");
		saveTimer = null;
		if (savedSucessfully) {
			status.className = "hidden";
		} else {
			status.innerHTML = "Still working...";
			status.className = "working";
			waitToCancel();
		}
	}, 800);
}

function saveOption(theKey, theValue) {
	var status = document.getElementById("status");
	if (isChromeExtension) {
		savedSucessfully = false;
		status.innerHTML = "Saving...";
		status.className = "saving";
		var syncValue = {};
		syncValue[theKey] = theValue;
		chrome.storage.sync.set(syncValue, function() {
			status.innerHTML = "Saved.";
			status.className = "saved";
			savedSucessfully = true;
		});
	} else {
		saved_options[theKey] = theValue;
		console.log(saved_options);
		localStorage.setItem('wk_options', JSON.stringify(saved_options));
		status.innerHTML = "Saved.";
		status.className = "saved";
		savedSucessfully = true;
	}
	waitToCancel();
}


/* INITIALIZE */
document.addEventListener('DOMContentLoaded', function() {
	var html_str = '';
	for (var i = 0; i < option_groups.length; ++i) {
		var optionset = option_groups[i];
		var metadata = optionset[0];
		var inputType = metadata[1];
		var description = metadata[2];
		html_str += '<div class="option-set"><h3>' + metadata[0] + '</h3>';
		if (description)
			html_str += '<em>'+description+'</em>';
		for (var j = 1; j < optionset.length; ++j) {
			var option = optionset[j];
			html_str += '<p><label><input type="'+inputType+'" class="'+option[2]+'" name="'+option[2]+'" value="'+option[1]+'" /> ' + option[0] + '</label>';
			var author = option[3];
			if (author)
				html_str += '<a href="http://www.wanikani.com/chat/api-and-third-party-apps/'+author[1]+'" class="byline" target="_blank"> by ' + author[0] + '</a>';
			html_str += '<p>';
		}
		html_str += '</div>';
	}
	document.getElementById('options').innerHTML = html_str;

	// OPTIONS
	function saveEventValue(event) {
		saveOption(event.target.value, event.target.checked);
	}

	function saveEventInverted(event) {
		saveOption(event.target.value, !event.target.checked);
	}

	var customBoxes = document.getElementsByClassName('check');
	for (var i = 0; i < customBoxes.length; i++) {
		customBoxes[i].addEventListener('click', saveEventValue);
	}
	var invertedBoxes = document.getElementsByClassName('check-i');
	for (var i = 0; i < invertedBoxes.length; i++) {
		invertedBoxes[i].addEventListener('click', saveEventInverted);
	}

	function initialize(items) {
		for (var i = 0; i < customBoxes.length; i++) {
			var customItem = customBoxes[i];
			if (items[customItem.value])
				customItem.checked = true;
		}
		for (var i = 0; i < invertedBoxes.length; i++) {
			var customItem = invertedBoxes[i];
			if (!items[customItem.value])
				customItem.checked = true;
		}
	}

	if (isChromeExtension) {
		chrome.storage.sync.get(null, function(items) {
			initialize(items);
		});
	} else {
		var items = localStorage.getItem('wk_options');
		console.log(items);
		if (items)
			saved_options = JSON.parse(items);
		if (!saved_options)
			saved_options = {};
		initialize(saved_options);
	}
});
