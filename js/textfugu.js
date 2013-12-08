var loc = document.location;
var splitted = loc.hostname.split('.');
var pagename = splitted[1] == 'com' ? splitted[0] : splitted[1];
var isTF = pagename === 'textfugu';

if (isTF || pagename === 'etoeto') {
	var section = loc.pathname;
	if (section.length > 6) {
		var subsection = section.substring(1, 7);
		if (subsection === 'latest') {
			var latest = localStorage.getItem('latest-page');
			console.log('Redirecting to cache: ' + latest);
			document.location = latest ? latest : isTF ? '/lessons/' : '/browse/';
		} else if (isTF ? subsection === 'season' : subsection === 'course') {
			console.log('Setting cached path: ' + section);
			localStorage.setItem('latest-page', section);
		}
	}
}
