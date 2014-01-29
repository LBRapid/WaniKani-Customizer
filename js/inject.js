if (!window.$) {
	for (var key in window) {
		if (key.substr(0, 6).toLowerCase() == 'jquery') {
			window.$ = window[key].handle;
			break;
		}
	}
}

if (window.$) {
	var bookmarks;

	function updateBookmark(thread, page) {
		bookmarks[thread] = page;
		localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
	}

	// Page load
	$(function() {
		var stored = $('#customizer').html();
		if (stored && stored.length !== 0) {
			window.options = JSON.parse(stored);
		} else {
			window.options = {};
		}
		var revDisplay = $('li.reviews a');
		if (revDisplay && revDisplay.find('span').text() != '0') {
			revDisplay.attr('href', '/review/session');
		}
		revDisplay = $('li.lessons a');
		if (revDisplay && revDisplay.find('span').text() != '0') {
			revDisplay.attr('href', '/lesson/session');
		}

		var splitted = document.location.pathname.split('/');
		var siteSection = splitted[1];
		var isHome = !siteSection || siteSection === 'dashboard';
		if (isHome || siteSection === 'chat') {
			bookmarks = localStorage.getItem('bookmarks');
			if (bookmarks) {
				bookmarks = JSON.parse(bookmarks);
			} else {
				bookmarks = {};
			}
		}
		if (isHome) {
			$('.forum-topics-list table tr td:first-child a:first-child').each(function() {
				var pageUrl = $(this).attr('href');
				var tid = pageUrl.split('/')[3];
				var storedPage = bookmarks[tid];
				if (storedPage)
					$(this).attr('href', pageUrl + '/page/' + storedPage);
			});
			var title = 'radicalData';
			var idx = 0;
			$('.lattice-single-character').each(function() {
				var stor = [];
				if (idx === 1) {
					stor = $(this).find('li').text().split('');
				} else {
					$(this).find('li').each(function() {
						var iName;
						iName = $(this).find('a').attr('data-original-title');
						stor.push(iName);
					});
				}
				localStorage.setItem(title, stor);
				if (++idx > 1)
					return;
				title = 'kanjiData';
			});
		} else if (siteSection === 'chat') {
			var pageNumber = splitted[5];
			if (pageNumber && pageNumber > 1) {
				var tid = splitted[3];
				updateBookmark(tid, pageNumber);
			}

			if (!options.collapse_i) {
				$('div.forum-post > blockquote > blockquote').click(function() {
					$(this).toggleClass('collapsable');
				});
			}
		}
		var itemCount = $('.navbar-static-top li.lessons a span').text();
		if (itemCount) {
			if (itemCount != '0') {
				if (options.redirect_first) {
					if (localStorage.getItem('lessonsFound')) {
						loadLessons = false;
					} else {
						localStorage.setItem('lessonsFound', true);
						location.href = '/lesson/session';
						return;
					}
				}
			} else {
				localStorage.setItem('lessonsFound', false);
			}
		}
		if (options.redirect_first) {
			var nextTimeDisplay = $('.review-status li.next time');
			if (nextTimeDisplay.length > 0) {
				var diff = nextTimeDisplay.attr('datetime') - new Date().getTime() / 1000;
				if (diff > 30) {
					setTimeout(function() {
						location.href = '/review/session';
					}, Math.ceil(diff * 1000) + 1000);
					return;
				}
			}
		}
	});
}

window.onfocus = function() {
	if (typeof DateTime !== "undefined")
		DateTime.activateFuzzyDate();
};
