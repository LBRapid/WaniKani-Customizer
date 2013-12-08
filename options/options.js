var option_groups = [
	[
		['Redirect WaniKani pages to reviews and lessons', 'radio'],
		['Never', '-1', 'redirect'],
		['When first available', '0', 'redirect']
	],
	[
		['Reviews & Lessons', 'checkbox'],
		['Sort Radicals to the front of the queue', 'sort_rad', 'check-i'],
		['Differentiate meanings and on/kun readings', 'disable_custom_reviews', 'check-i']
	],
	[
		['Tofugu Services', 'checkbox'],
		['TextFugu user', 'textfugu', 'check'],
		['EtoEto user', 'etoeto', 'check'],
	],
	[
		['Userscripts', 'checkbox', 'Additional options created by the WaniKani community'],
		['Collapsable nested quotes on the forums', 'no_collapse', 'check-i', ['pankeki', '2752']]
	],
	[
		['Miscellaneous', 'checkbox'],
		['24 hour format', '12_hours', 'check-i'],
	]
];


/* SAVE */
var saveTimer, savedSucessfully;

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
	savedSucessfully = false;
	var status = document.getElementById("status");
	status.innerHTML = "Saving...";
	status.className = "saving";
	var syncValue = {};
	syncValue[theKey] = theValue;
	chrome.storage.sync.set(syncValue, function() {
		status.innerHTML = "Saved.";
		status.className = "saved";
		savedSucessfully = true;
	});
	waitToCancel();
}


/* INITIALIZE */
document.addEventListener('DOMContentLoaded', function() {
	var html_str = '';
	for (var i = 0; i < option_groups.length; ++i) {
		var options = option_groups[i];
		var metadata = options[0];
		var inputType = metadata[1];
		var description = metadata[2];
		html_str += '<div class="option-set"><h3>' + metadata[0] + '</h3>';
		if (description)
			html_str += '<em>'+description+'</em>';
		for (var j = 1; j < options.length; ++j) {
			var option = options[j];
			html_str += '<p><label><input type="'+inputType+'" class="'+option[2]+'" name="'+option[2]+'" value="'+option[1]+'" /> ' + option[0] + '</label>';
			var author = option[3];
			if (author)
				html_str += '<a href="http://www.wanikani.com/chat/api-and-third-party-apps/'+author[1]+'" class="byline" target="_blank"> by ' + author[0] + '</a>';
			html_str += '<p>';
		}
		html_str += '</div>';
	}
	document.getElementById('options').innerHTML = html_str;

	var customBoxes = document.getElementsByClassName('check');
	for (var i = 0; i < customBoxes.length; i++) {
		customBoxes[i].addEventListener('click', saveEventValue);
	}
	var invertedBoxes = document.getElementsByClassName('check-i');
	for (var i = 0; i < invertedBoxes.length; i++) {
		invertedBoxes[i].addEventListener('click', saveEventInverted);
	}
	var radioItems = document.getElementsByClassName('redirect');
	for (var i = 0; i < radioItems.length; i++) {
		radioItems[i].addEventListener('click', saveInteger);
	}

	chrome.storage.sync.get(null, function(items) {
		var prevLevel = items['redirect'];
		if (!prevLevel) {
			prevLevel = 0;
		}
		for (var i = 0; i < radioItems.length; i++) {
			var radItem = radioItems[i];
			if (parseInt(radItem.value) == prevLevel) {
				radItem.checked = true;
				break;
			}
		}
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
	});
});


/* OPTION EVENTS */
function saveInteger(event) {
	var newLevel = parseInt(event.target.value);
	saveOption(event.target.name, newLevel);
}

function saveEventValue(event) {
	saveOption(event.target.value, event.target.checked);
}

function saveEventInverted(event) {
	saveOption(event.target.value, !event.target.checked);
}
