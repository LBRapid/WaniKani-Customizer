var options, radData, kanData, prevItem;
var kunyomi_list = [
	"売","草","戸","糸","皿","竹","皮","花","耳","又","雪","打","村","貝","赤","夏","兄","広","父","冬","久","谷","川","田","目","夕","付","左","手","合","四","犬","引","玉","申","々","投","雲","森","朝","紙","首","何","雨","色","里","羽","池","黄","星","麦","母","丸","見","右","虫","石","林","氷","考","飲","泳","顔","軽","葉","頭","起","読","横","追","島","待","受","指","拾","伝","仲","寒","湯","歯","昔","始","持","乗","物","良","声","方","鳴","答","橋","緑","鏡","様","悲","祭","暑","着","皆","場","買","泣","猫","秋","帰","晴","昼","春","浅","寺","岩","坂","浜","芽","甘","替","奪","磨","貸","埼","滝","翔","懐","遠","遊","荒","俺","鼻","塩","熊","戻","梅","箱","荷","喜","笑","取","浴","若","舌","胸","忙","困","底","臭","穴","岡","尻","浮","焼","株","渡","宮","違","狭","届","腰","肩","値","割","傘","側","呼","抜","針","掛","城","細","厚","藤","靴","娘","江","詰","渇","押","枕","悩","酢","縦","幾","亀","彼","卵","飼","込","机","窓","灰","汗","杉","爪","裏","巣","捨","鍋","払","埋","吐","芋","恥","豚","緩","寝","抱","繰","伸","津","幅","沖","扱","宜","控","壁","片","稲","駆","吹","堀","桃","瀬","蛍","虎","蜂","桜","枠","賭","髪","梨","伺","畑","涙","堅","綱","潟","誰","笠","嵐","姫","謎","刃","侍","曇","呪","也","頃","舟","肌","棚","釣","腕","芝","袋","柄","琴","沼","垣","叱",
	"墨","癖","吾","鍵","猿","箸","霧","唇","虹","爽","脇","咲","踊","闇","霜","蚊","貼","蛇","煮","駒","桑","鰐","蟹","淀"
];
var bookmarks = localStorage.getItem('bookmarks');
if (bookmarks) {
	bookmarks = JSON.parse(bookmarks);
} else {
	bookmarks = {};
}

function updateBookmark(thread, page) {
	bookmarks[thread] = page;
	localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

function levelIndex(item, currRad, currKan) {
	if (item.rad) {
		if (currRad && currRad.indexOf(item.en[0]) !== -1)
			return 0;
	} else if (item.kan) {
		if (currKan && currKan.indexOf(item.kan) !== -1)
			return 1;
	}
	return 2;
}

// Lesson/Review queuing
function setLessonsQueue(needsUpdating) {
	if (options.sort_rad_i)
		return;
	var revArr = $.jStorage.get('l/activeQueue');
	if (!revArr)
		return;
	var storedReviews = $.jStorage.get("l/lessonQueue");
	if (!needsUpdating) {
		for (var i = 0; i < storedReviews.length; ++i) {
			var item = storedReviews[i];
			if (item && item.rad) {
				needsUpdating = true;
				break;
			}
		}
	}
	if (!needsUpdating)
		return;

	var itemsArrays = [[], [], []];
	storedReviews = storedReviews.concat(revArr);
	var currCount = 0;
	for (var i = 0; i < storedReviews.length; ++i) {
		var item = storedReviews[i];
		if (item && item.rad) {
			console.log(item);
			itemsArrays[0].push(item);
			++currCount;
		} else {
			itemsArrays[2].push(item);
		}
	}
	var actQueue = itemsArrays[0].concat(itemsArrays[1]);
	$.jStorage.set('l/activeQueue', actQueue);
	$.jStorage.set('l/lessonQueue', itemsArrays[2]);
}

function setReviewQueue(needsUpdating) {
	var currRad = !options.sort_rad_i ? localStorage.getItem('radicalData') : null;
	var currKan = options.sort_kan ? localStorage.getItem('kanjiData') : null;
	var storedReviews = $.jStorage.get("reviewQueue");
	var checkBurn = false; // !options.sort_burn_i; TODO fix
	if (!needsUpdating) {
		for (var i = 0; i < storedReviews.length; ++i) {
			var item = storedReviews[i];
			if (!item)
				continue;
			if ((checkBurn && item.srs == 8) || levelIndex(item, currRad, currKan) !== 2) {
				needsUpdating = true;
				break;
			}
		}
	}
	if (!needsUpdating)
		return;

	var itemsArrays = [[], [], []];
	var revArr = $.jStorage.get('activeQueue');
	if (!revArr)
		return;
	storedReviews = storedReviews.concat(revArr);
	var currCount = 0, burnCount = 0;
	for (var i = 0; i < storedReviews.length; ++i) {
		var item = storedReviews[i];
		if (item) {
			var li;
			if (checkBurn && item.srs == 8) {
				li = 1;
				++burnCount;
			} else {
				li = levelIndex(item, currRad, null);
				if (li < 2)
					++currCount;
			}
			itemsArrays[li].push(item);
		}
	}
	var actQueue = itemsArrays[0].concat(itemsArrays[1]);
	$.jStorage.set('activeQueue', actQueue);
	$.jStorage.set('reviewQueue', itemsArrays[2]);
	$('#question #current-count').text(currCount);
	$('#question #burn-count').text(burnCount);
	$('#question #current-stats').toggle(currCount > 0);
	$('#question #burn-stats').toggle(burnCount > 0);
}

function onItemFinished(key, action) {
	if (!prevItem)
		return;
	if (prevItem.srs == 8) {
		var currText = $('#question #burn-count');
		var currValue = parseInt(currText.text());
		if (currValue > 1) {
			currText.text(currValue - 1);
		} else {
			$('#question #burn-stats').hide();
		}
	} else {
		var lIdx = levelIndex(prevItem, radData, kanData);
		if (lIdx < 2) {
			var currText = $('#question #current-count');
			var currValue = parseInt(currText.text());
			if (currValue > 1) {
				currText.text(currValue - 1);
			} else {
				$('#question #current-stats').hide();
			}
		}
	}
}

if ($.jStorage && $('#lessons').length == 0) {
	radData = localStorage.getItem('radicalData');
	kanData = localStorage.getItem('kanjiData');
	$.jStorage.listenKeyChange('lastItems', onItemFinished);
	$('input').attr('autocomplete', 'off');
	$.jStorage.listenKeyChange('currentItem', function(key, action) {
		var item = $.jStorage.get(key);
		if (!item)
			return;
		var burning = item.srs == 8;
	    var lIdx = levelIndex(item, radData, kanData);
		$('.icon-chevron-right').toggleClass('icon-burn burning', burning);
		$('.icon-chevron-right').toggleClass('icon-level active-level', !burning && lIdx !== 2);
		if (lIdx === 0) {
			console.log(item.rad + ': ' + item.en[0]);
		} else if (lIdx === 1) {
			var read = item.emph === 'onyomi' ? item.on : item.kun;
			console.log(item.kan + ': ' + item.en[0] + '  ' + read);
		}

		var kChar = item.kan;
		if (kChar) {
			setTimeout(function() {
				var quest = $('#question-type.reading');
				if (quest.length !== 0) {
					var found = 'On';
					for (var i = 0; i < kunyomi_list.length; i++) {
					    if (kunyomi_list[i] === kChar) {
					        found = 'Kun';
					        break;
					    }
					}
					quest.html('<h1><strong>' + found + "'yomi</strong> Reading?</h1>");
				}
			}, 0);
		}
		prevItem = item;
	});
}

// Page load
$(function() {
	var stored = $('#customizer').html();
	if (stored && stored.length !== 0) {
		options = JSON.parse(stored);
	} else {
		options = {};
	}
	if ($.jStorage) {
		if ($('#lessons').length > 0) {
			setLessonsQueue(true);
			setTimeout(setLessonsQueue, 2000);
		} else {
			setReviewQueue(true);
			setTimeout(function() { setReviewQueue(true); }, 5000);
			setInterval(setReviewQueue, 60000);
		}
		return;
	}
	var revDisplay = $('li.reviews a');
	if (revDisplay && revDisplay.find('span').text() != '0') {
		revDisplay.attr('href', '/review/session');
	}
	revDisplay = $('li.lessons a');
	if (revDisplay && revDisplay.find('span').text() != '0') {
		revDisplay.attr('href', '/lesson/session');
	}

	if (!options.no_collapse_i) {
		$("div.forum-post > blockquote > blockquote").click(function() {
			$(this).toggleClass('collapsable');
		});
	}

	var splitted = document.location.pathname.split('/');
	var siteSection = splitted[1];
	if (!siteSection || siteSection === 'dashboard') {
		$('.forum-topics-list table tr td:first-child a:first-child').each(function() {
			var pageUrl = $(this).attr('href');
			var tid = pageUrl.split('/')[3];
			var storedPage = bookmarks[tid];
			if (storedPage)
				$(this).attr('href', pageUrl + '/page/' + storedPage);
		});
		var title = 'radicalData';
		var idx = 0;
		$('.lattice-single-character ul').each(function() {
			var stor = [];
			if (idx === 1) {
				// stor = $(this).find('li').text().split('');
				return;
			} else {
				$(this).find('li').each(function() {
					var iName;
					iName = $(this).find('a').attr('data-original-title');
					stor.push(iName);
				});
			}
			localStorage.setItem(title, stor);
			title = 'kanjiData';
			++idx;
		});
	} else if (siteSection === 'chat') {
		var pageNumber = splitted[5];
		if (pageNumber && pageNumber > 1) {
			var tid = splitted[3];
			updateBookmark(tid, pageNumber);
		}
	}
	var itemCount = $('.navbar-static-top li.lessons a span').text();
	if (itemCount) {
		if (itemCount != '0') {
			var loadLessons = options.redirect_i;
			if (!loadLessons) {
				if (!localStorage.getItem('lessonsFound')) {
					loadLessons = true;
					localStorage.setItem('lessonsFound', true);
				}
			}
			if (loadLessons) {
				window.location.pathname = '/lesson/session';
				return;
			}
		} else {
			localStorage.setItem('lessonsFound', false);
		}
	}
	if (!options.redirect_i) {
		var nextTimeDisplay = $('.review-status li.next time');
		if (nextTimeDisplay.length > 0) {
			var diff = nextTimeDisplay.attr('datetime') - new Date().getTime() / 1000;
			console.log(diff);
			if (diff > 10) {
				setTimeout(function() {
					window.location.pathname = '/review/session';
				}, Math.ceil(diff * 1000) + 1000);
				return;
			}
		}
	}
});

window.onfocus = function() {
	if (typeof DateTime !== "undefined")
		DateTime.activateFuzzyDate();
};
