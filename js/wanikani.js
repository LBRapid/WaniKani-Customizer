var isChromeExtension = typeof chrome != 'undefined';
var page_width, tRes, apiKey;
var options;


/* RESOURCES */
function resourceUrlFor(name, ext, directory) {
	name = (directory ? directory : ext) + '/' + name + '.' + ext;
	return isChromeExtension ? chrome.extension.getURL(name) : safari.extension.baseURI + name;
}

function createResource(name, isJS, directory) {
	var element = document.createElement(isJS ? 'script' : 'link');
	if (isJS) {
		element.type = 'text/javascript';
		element.src = resourceUrlFor(name, 'js', directory);
	} else {
		element.type = 'text/css';
		element.rel = 'stylesheet';
		element.href = resourceUrlFor(name, 'css', directory);
	}
	document.head.appendChild(element);
	return element;
}


/* READY */
function setOptions(items) {
	var div = document.createElement("div");
	div.style.display = "none";
	div.id = "customizer";
	div.innerHTML = JSON.stringify(items);
	document.body.appendChild(div);
	// $('body').append('<div id="customizer" style="display:none;"></div>');
	// $('#customizer').text(JSON.stringify(items));
}

function insertNav(hasTF, hasEE) {
	var right_nav = $('.navbar-inner .nav-collapse ul.pull-right');
	if (hasEE)
		right_nav.prepend('<li class="nav-extras"><a href="http://www.etoeto.com/latest" target="_blank"><span style="display:block;">EE</span>EtoEto</a></li>');
	if (hasTF)
		right_nav.prepend('<li class="nav-extras"><a href="http://www.textfugu.com/latest" target="_blank"><span style="display:block;">TF</span>TextFugu</a></li>');
}

$(document).ready(function() {
	var loc = document.location;
	if (!isChromeExtension && loc.hostname.indexOf('wanikani') === -1)
		return;
	createResource('common', false);
	if (isChromeExtension) {
		chrome.storage.sync.get(null, function(items) {
			options = items;
			setOptions(items);
			if (!options.custom_reviews_i)
				createResource('custom', false);
			if (!options.collapse_i)
				createResource('collapse', false, 'userscripts');
			createResource('inject', true);
			insertNav(items.textfugu, items.etoeto);
		});
	} else {
		// options = localStorage.getItem('wk_options');
		// if (options) {
		// 	options = JSON.parse(options);
		// }
		if (!options)
			options = {};
		// setOptions(options);
		createResource('custom', false);
		createResource('collapse', false, 'userscripts');
		createResource('inject', true);
		insertNav(true, true);
	}
	var splitted = loc.pathname.split('/');
	var siteSection = splitted[1];
	if (!siteSection || siteSection === 'dashboard') {
		page_width = $('.span12 header').width();
		if (page_width) {
			tRes = Math.round(1 / (page_width / 1170 / 15));
			var splitted = loc.pathname.split('/');
			insertTimeline();
		}
	} else if (siteSection === 'account') {
		apiKey = $('input[placeholder="Key has not been generated"]').val();
		if (apiKey) {
			console.log('Updated API key: ' + apiKey);
			var alreadySaved = localStorage.getItem('apiKey');
			localStorage.setItem('apiKey', apiKey);
			if (!alreadySaved)
				document.location.pathname = '/dashboard';
		}
	} else if (siteSection === 'review') {
		$('#stats').prepend('<span id="current-stats" style="display:none;"><i class="icon-level"></i><span id="current-count"></span></span><span id="burn-stats" style="display:none;"><i class="icon-burn"></i><span id="burn-count"></span></span>');
	}
	if (isChromeExtension) {
		$("ul.dropdown-menu li:nth-child(3)").after('<li><a id="customizer-options" href="#">Customizer</a></li>');
		$(document).on('click', '#customizer-options', function() {
			window.open(resourceUrlFor('options', 'html', 'options'));
			return false;
		});
	}
});
