if (!window.$) {
	for (var key in window) {
		if (key.substr(0, 6).toLowerCase() == 'jquery') {
			window.$ = window[key].handle;
			break;
		}
	}
}

if (window.$) {
	var hasSortingAvailable = false;
	var listening = true, initialized = false;
	var options, radData, kanData, prevItem, bookmarks, lightning;
	var prevCount = 0;

	function updateBookmark(thread, page) {
		bookmarks[thread] = page;
		localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
	}

	function levelIndex(item, currRad, currKan) {
		if (item.rad) {
			if (currRad && radData.indexOf(item.en[0]) !== -1)
				return 0;
		} else if (currKan && item.kan) {
			if (kanData.indexOf(item.kan) !== -1)
				return 1;
		}
		return 2;
	}

	// Lesson/Review queuing
	function setLessonsQueue() {
		if (!listening)
			return;
		listening = false;
		setTimeout(function() {
			listening = true;
		}, 100);

		var sortRad = !options.sort_rad_i, sortKan = options.sort_kan;
		if (!sortRad && !sortKan)
			return;
		var storedReviews = $.jStorage.get("l/lessonQueue");
		var needsUpdating = false;
		for (var i = 0; i < storedReviews.length; ++i) {
			var item = storedReviews[i];
			if (!item)
				continue;
			if ((sortRad && item.rad) || (sortKan && item.kan)) {
				needsUpdating = true;
				break;
			}
		}
		if (!needsUpdating)
			return;
		var activeArr = $.jStorage.get('l/activeQueue');
		if (!activeArr)
			return;

		var itemsArrays = [[], [], []];
		storedReviews = storedReviews.concat(activeArr);
		var kanjiAdded = 0;
		for (var i = 0; i < storedReviews.length; ++i) {
			var item = storedReviews[i];
			if (!item)
				continue;
			var idx = 2;
			if (item.rad) {
				if (sortRad)
					idx = 0;
			} else if (item.kan) {
				if (sortKan && kanjiAdded < 5) {
					idx = 1;
					++kanjiAdded;
				}
			}
			itemsArrays[idx].push(item);
		}
		var actQueue = itemsArrays[0];
		var saveForLater = itemsArrays[2];
		if (actQueue.length == 0) {
			actQueue = itemsArrays[1];
		} else {
			saveForLater = saveForLater.concat(itemsArrays[1]);
		}
		if (actQueue[0])
			$.jStorage.set('l/currentLesson', actQueue[0]);
		$.jStorage.set('l/activeQueue', actQueue);
		$.jStorage.set('l/lessonQueue', saveForLater);
	}

	function setReviewQueue() {
		if (initialized && !listening)
			return;
		listening = false;
		setTimeout(function() {
			listening = true;
		}, 1000);

		var checkRad = !options.sort_rad_i, checkKan = options.sort_kan, checkBurn = !options.sort_burn_i;
		var storedReviews = $.jStorage.get('activeQueue');
		if (storedReviews) {
			storedReviews = storedReviews.concat($.jStorage.get('reviewQueue'));
		} else {
			storedReviews = $.jStorage.get('reviewQueue');
		}
		var needsUpdating;

		var itemsArrays = [[], [], []];
		var currCount = 0, burnCount = 0;
		for (var i = 0; i < storedReviews.length; ++i) {
			var item = storedReviews[i];
			if (item) {
				var li = 2;
				if (item.srs == 8) {
					if (checkBurn)
						li = 1;
					++burnCount;
				} else {
					li = levelIndex(item, checkRad, checkKan);
					if (li < 2)
						++currCount;
				}
				itemsArrays[li].push(item);
			}
		}

		var actQueue = itemsArrays[0];
		var laterQueue = itemsArrays[2];
		var needsUpdating = true;
		if (actQueue.length == 0) {
			actQueue = itemsArrays[1];
			if (actQueue.length == 0)
				needsUpdating = false;
		} else {
			laterQueue.concat(itemsArrays[1]);
		}
		if (needsUpdating) {
			hasSortingAvailable = true;
			initialized = true;
			$.jStorage.set('reviewQueue', laterQueue);
			$.jStorage.set('activeQueue', actQueue);
			prevItem = actQueue[0];
			if (prevItem.rad)
				$.jStorage.set('questionType', 'meaning');
			$.jStorage.set('currentItem', prevItem);
		}
		if (currCount > 0)
			$('#question #current-count').text(currCount);
		if (burnCount > 0)
			$('#question #burn-count').text(burnCount);
		$('#question #current-stats').toggle(currCount > 0);
		$('#question #burn-stats').toggle(burnCount > 0);
	}

	if ($.jStorage && document.getElementById('reviews')) {
		var kunyomi_list = {"売":1,"草":1,"戸":1,"糸":1,"皿":1,"竹":1,"皮":1,"花":1,"耳":1,"又":1,"雪":1,"打":1,"村":1,"貝":1,"赤":1,"夏":1,"兄":1,"広":1,"父":1,"冬":1,"久":1,"谷":1,"川":1,"田":1,"目":1,"夕":1,"付":1,"左":1,"手":1,"合":1,"四":1,"犬":1,"引":1,"玉":1,"申":1,"々":1,"投":1,"雲":1,"森":1,"朝":1,"紙":1,"首":1,"何":1,"雨":1,"色":1,"里":1,"羽":1,"池":1,"黄":1,"星":1,"麦":1,"母":1,"丸":1,"見":1,"右":1,"虫":1,"石":1,"林":1,"氷":1,"考":1,"飲":1,"泳":1,"顔":1,"軽":1,"葉":1,"頭":1,"起":1,"読":1,"横":1,"追":1,"島":1,"待":1,"受":1,"指":1,"拾":1,"伝":1,"仲":1,"寒":1,"湯":1,"歯":1,"昔":1,"始":1,"持":1,"乗":1,"物":1,"良":1,"声":1,"方":1,"鳴":1,"答":1,"橋":1,"緑":1,"鏡":1,"様":1,"悲":1,"祭":1,"暑":1,"着":1,"皆":1,"場":1,"買":1,"泣":1,"猫":1,"秋":1,"帰":1,"晴":1,"昼":1,"春":1,"浅":1,"寺":1,"岩":1,"坂":1,"浜":1,"芽":1,"甘":1,"替":1,"奪":1,"磨":1,"貸":1,"埼":1,"滝":1,"翔":1,"懐":1,"遠":1,"遊":1,"荒":1,"俺":1,"鼻":1,"塩":1,"熊":1,"戻":1,"梅":1,"箱":1,"荷":1,"喜":1,"笑":1,"取":1,"浴":1,"若":1,"舌":1,"胸":1,"忙":1,"困":1,"底":1,"臭":1,"穴":1,"岡":1,"尻":1,"浮":1,"焼":1,"株":1,"渡":1,"宮":1,"違":1,"狭":1,"届":1,"腰":1,"肩":1,"値":1,"割":1,"傘":1,"側":1,"呼":1,"抜":1,"針":1,"掛":1,"城":1,"細":1,"厚":1,"藤":1,"靴":1,"娘":1,"江":1,"詰":1,"渇":1,"押":1,"枕":1,"悩":1,"酢":1,"縦":1,"幾":1,"亀":1,"彼":1,"卵":1,"飼":1,"込":1,"机":1,"窓":1,"灰":1,"汗":1,"杉":1,"爪":1,"裏":1,"巣":1,"捨":1,"鍋":1,"払":1,"埋":1,"吐":1,"芋":1,"恥":1,"豚":1,"緩":1,"寝":1,"抱":1,"繰":1,"伸":1,"津":1,"幅":1,"沖":1,"扱":1,"宜":1,"控":1,"壁":1,"片":1,"稲":1,"駆":1,"吹":1,"堀":1,"桃":1,"瀬":1,"蛍":1,"虎":1,"蜂":1,"桜":1,"枠":1,"賭":1,"髪":1,"梨":1,"伺":1,"畑":1,"涙":1,"堅":1,"綱":1,"潟":1,"誰":1,"笠":1,"嵐":1,"姫":1,"謎":1,"刃":1,"侍":1,"曇":1,"呪":1,"也":1,"頃":1,"舟":1,"肌":1,"棚":1,"釣":1,"腕":1,"芝":1,"袋":1,"柄":1,"琴":1,"沼":1,"垣":1,"叱":1,"墨":1,"癖":1,"吾":1,"鍵":1,"猿":1,"箸":1,"霧":1,"唇":1,"虹":1,"爽":1,"脇":1,"咲":1,"踊":1,"闇":1,"霜":1,"蚊":1,"貼":1,"蛇":1,"煮":1,"駒":1,"桑":1,"鰐":1,"蟹":1,"淀":1};
		radData = localStorage.getItem('radicalData');
		kanData = localStorage.getItem('kanjiData');

		$.jStorage.listenKeyChange('lastItems', function(key, action) {
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
				var lIdx = levelIndex(prevItem, true, true);
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
		});
		var ignoreNextActive = false;
		$.jStorage.listenKeyChange('activeQueue', function(key, action) {
			if (ignoreNextActive) {
				ignoreNextActive = false;
				return;
			}
			var active = $.jStorage.get(key);
			if (active) {
				ignoreNextActive = true;
				$.jStorage.set(key, active.filter(function(n){return n}));
			}
		});

		var ignoreNextItem = false;
		$.jStorage.listenKeyChange('currentItem', function(key, action) {
			var item = $.jStorage.get(key);
			if (!item)
				return;
			var burning = item.srs == 8;
			var lIdx = levelIndex(item, true, true);
			var newCount = $('#question #available-count').text();
			if (newCount > prevCount)
				hasSortingAvailable = true;
			if (hasSortingAvailable && !((!options.sort_burn_i && burning) || (!options.sort_rad_i && lIdx == 0) || (options.sort_kan && lIdx == 1))) {
				console.log('Needs resorting');
				initialized = true;
				prevCount = newCount;
				hasSortingAvailable = false;
				setReviewQueue();
				return;
			}
			var skipping = ignoreNextItem;
			if (skipping) {
				ignoreNextItem = false;
			} else if (lightning) {
				if (newCount == prevCount && lightning && prevItem) {
					var e = prevItem;
					var t = e.kan ? $.jStorage.get("k" + e.id) : e.voc ? $.jStorage.get("v" + e.id) : null;
					if (t && (typeof t.mc != "undefined" || typeof t.rc != "undefined")) {
						var r = t.mc >= 1 ? "reading" : t.rc >= 1 ? "meaning" : null;
						if (r !== null) {
							ignoreNextItem = true;
							$.jStorage.set("questionType", r);
							$.jStorage.set(key, e);
							return;
						}
					}
				} else if (item.rad) {
					// console.log('enforce rad');
					$.jStorage.set('questionType', 'meaning');
				}
			}
			prevCount = newCount;
			$('.icon-chevron-right').toggleClass('icon-burn burning', burning);
			$('.icon-chevron-right').toggleClass('icon-level active-level', !burning && lIdx !== 2);
			if (!skipping) {
				if (lIdx === 0) {
					console.log(item.rad + ': ' + item.en[0]);
				} else if (lIdx === 1) {
					var read = item.emph === 'onyomi' ? item.on : item.kun;
					console.log(item.kan + ': ' + item.en[0] + '  ' + read);
				}
			}

			var kChar = item.kan;
			if (kChar) {
				setTimeout(function() {
					var quest = $('#question-type.reading');
					if (quest.length !== 0) {
						var found = kunyomi_list[kChar] ? 'Kun' : 'On';
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
			if (document.getElementById('lessons')) {
				setTimeout(function() {
					if (!initialized)
						setLessonsQueue();
				}, 1000);
				$.jStorage.listenKeyChange('l/activeQueue', function(key, action) {
					if (!listening)
						return;
					var queue = $.jStorage.get(key);
					if (queue.length == 0)
						return;
					setTimeout(setLessonsQueue, 0);
					initialized = true;
				});
				return;
			}
			if (document.getElementById('reviews')) {
				lightning = localStorage.getItem('lightning');
				if (lightning === 'false')
					lightning = false;
				$('#summary-button').append('<a id="lightning-mode" href="#"'+(lightning?' class="active"':'')+'><i class="icon-bolt"></i></a>');
				$('#lightning-mode').click(function() {
					lightning = !lightning;
					localStorage.setItem('lightning', lightning);
					$(this).toggleClass('active', lightning);
					return false;
				});
				setTimeout(function() {
					if (!initialized)
						setReviewQueue();
				}, 1000);
				var observer = new WebKitMutationObserver(function(mutations) {
					if (!lightning)
						return;
					for (var idx in mutations) {
						var mut = mutations[idx].target;
						if (mut.tagName === 'FIELDSET') {
							if (mut.className === 'correct') {
								// var ae = $('#answer-exception');
								// if (ae.hasClass('animated')) {
								// 	setTimeout(function() {
								// 		ae.removeClass('animated');
								// 	}, 3000);
								// 	console.log(ae.text());
								// }
								$('#answer-form button').click();
							} else {
								$('#additional-content #option-item-info').click();
							}
							break;
						}
					}
				});
				observer.observe(document.getElementById('question'), {attributes: true, subtree: true, attributeFilter: ['class']});
				return;
			}
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
			$('.lattice-single-character ul').each(function() {
				var stor = [];
				if (idx === 1) {
					stor = $(this).find('li').text().split('');
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

			if (!options.collapse_i) {
				$('div.forum-post > blockquote > blockquote').click(function() {
					$(this).toggleClass('collapsable');
				});
			}
		}
		var itemCount = $('.navbar-static-top li.lessons a span').text();
		if (itemCount) {
			if (itemCount != '0') {
				if (options.redirect) {
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
		if (options.redirect) {
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
