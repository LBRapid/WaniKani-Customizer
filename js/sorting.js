if (window.$ && $.jStorage) {
	$(function() {
		var reviewing = document.getElementById('reviews') != null;
		if (!reviewing && !document.getElementById('lessons'))
			return;

		var correctAnswer = true;
		var sort_tier = 0;
		var listening = true, initialized = false;
		var radData, kanData, prevItem, lightning;
		var burned_count = -1, curr_count = -1;

		function levelIndex(item, currRad, currKan) {
			if (item.rad) {
				if (currRad && radData && radData.indexOf(item.en[0]) !== -1)
					return 0;
			} else if (currKan && item.kan) {
				if (kanData && kanData.indexOf(item.kan) !== -1)
					return 1;
			}
			return 3;
		}

		// Lesson/Review queuing
		function setLessonsQueue() {
			if (!listening)
				return;
			listening = false;
			setTimeout(function() {
				listening = true;
			}, 100);

			var sortRad = !options.sort_rad_i, sortKan = options.sort_kan_lessons;
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
			if (actQueue[0]) {
				$.jStorage.set('l/currentLesson', actQueue[0]);
				$.jStorage.set('l/activeQueue', actQueue);
				$.jStorage.set('l/lessonQueue', saveForLater);
			}
		}

		function setReviewQueue() {
			if (!listening)
				return false;
			listening = false;
			setTimeout(function() {
				listening = true;
			}, 100);

			var checkRad = !options.sort_rad_i, checkKan = options.sort_kan, checkBurn = !options.sort_burn_i;
			var storedReviews = $.jStorage.get('activeQueue');
			if (storedReviews) {
				storedReviews = storedReviews.concat($.jStorage.get('reviewQueue'));
			} else {
				storedReviews = $.jStorage.get('reviewQueue');
			}
			var rad_idx = -1, kan_idx = -1, burn_idx = -1;
			curr_count = 0;
			burned_count = 0;
			for (var i = 0; i < storedReviews.length; ++i) {
				var item = storedReviews[i];
				if (item) {
					if (item.srs == 8) {
						if (checkBurn)
							burn_idx = i;
						++burned_count;
					} else {
						var li = levelIndex(item, checkRad, checkKan);
						if (li < 2) {
							if (li == 1) {
								kan_idx = i;
							} else {
								rad_idx = i;
							}
							++curr_count;
						}
					}
				}
			}

			var active_idx = rad_idx;
			if (active_idx != -1) {
				sort_tier = 0;
			} else {
				if (kan_idx != -1) {
					active_idx = kan_idx;
					sort_tier = 1;
				} else {
					active_idx = burn_idx;
					sort_tier = 2;
				}
			}
			var needsUpdating = active_idx != -1;
			if (needsUpdating) {
				var next_array = storedReviews.splice(active_idx, 1);
				var next_item = next_array[0];
				if (next_item) {
					initialized = true;
					$.jStorage.set('reviewQueue', storedReviews);
					$.jStorage.set('activeQueue', next_array);
					prevItem = next_item;
					if (next_item.rad)
						$.jStorage.set('questionType', 'meaning');
					$.jStorage.set('currentItem', next_item);
				} else {
					needsUpdating = false;
					sort_tier = -1;
				}
			} else {
				sort_tier = -1;
			}
			if (curr_count > 0) {
				$('#question #current-count').text(curr_count);
			} else {
				curr_count = -1;
			}
			if (burned_count > 0) {
				$('#question #burn-count').text(burned_count);
			} else {
				burned_count = -1;
			}
			$('#question #current-stats').toggle(curr_count > 0);
			$('#question #burn-stats').toggle(burned_count > 0);
			return needsUpdating;
		}

		setTimeout(function() {
			if (!initialized)
				reviewing ? setReviewQueue() : setLessonsQueue();
		}, 1000);

		if (reviewing) {
			radData = localStorage.getItem('radicalData');
			kanData = localStorage.getItem('kanjiData');

			$.jStorage.listenKeyChange('lastItems', function(key, action) {
				if (!prevItem)
					return;
				if (burned_count != -1 && prevItem.srs == 8) {
					var currText = $('#question #burn-count');
					var currValue = parseInt(currText.text());
					--burned_count;
					if (currValue > 1) {
						currText.text(currValue - 1);
					} else {
						$('#question #burn-stats').hide();
						burned_count = -1;
					}
				} else if (curr_count != -1) {
					var lIdx = levelIndex(prevItem, true, true);
					if (lIdx < 2) {
						var currText = $('#question #current-count');
						var currValue = parseInt(currText.text());
						if (currValue > 1) {
							currText.text(currValue - 1);
						} else {
							$('#question #current-stats').hide();
							curr_count = -1;
						}
					}
				}
			});

			var ignoreNextItem = false;
			var currCount = 0;
			$.jStorage.listenKeyChange('currentItem', function(key, action) {
				var item = $.jStorage.get(key);
				if (!item)
					return;
				var burning = item.srs == 8;
				var lIdx = levelIndex(item, true, true);
				var prevCount = currCount;
				currCount = $('#question #available-count').text();
				if (currCount > prevCount)
					sort_tier = 0;

				if (!ignoreNextItem) {
					if (!correctAnswer || (sort_tier != -1 && sort_tier < (burning ? 2 : lIdx))) {
						if (setReviewQueue())
							return;
					}
					if (lightning && correctAnswer && prevItem && currCount == prevCount && !prevItem.rad) {
						var e = prevItem;
						var t = e.kan ? $.jStorage.get("k" + e.id) : $.jStorage.get("v" + e.id);
						if (t && (typeof t.mc != "undefined" || typeof t.rc != "undefined")) {
							var r = t.mc >= 1 ? "reading" : t.rc >= 1 ? "meaning" : null;
							if (r !== null) {
								prevItem = item;
								ignoreNextItem = true;
								$.jStorage.set('questionType', r);
								$.jStorage.set('currentItem', e);
								return;
							}
						}
					}
				}
				$('.icon-chevron-right').toggleClass('icon-burn burning', burning);
				$('.icon-chevron-right').toggleClass('icon-level active-level', !burning && lIdx < 2);

				if (item.rad) {
					$.jStorage.set('questionType', 'meaning');
				}
				prevItem = item;
				ignoreNextItem = false;
			});
		} else {
			$.jStorage.listenKeyChange('l/activeQueue', function(key, action) {
				if (!listening)
					return;
				if (!$('#answer-form').is(":visible")) {
					var queue = $.jStorage.get(key);
					if (queue.length == 0)
						return;
					setTimeout(setLessonsQueue, 0);
					initialized = true;
				}
			});
			var observer = new WebKitMutationObserver(function(mutations) {
				$('#quiz-ready-continue').click();
			});
			observer.observe(document.getElementById('screen-quiz-ready'), {attributes: true, subtree: true, attributeFilter: ['class']});
		}

		if (!options.custom_reviews_i) {
			$.jStorage.listenKeyChange(reviewing?'questionType':'l/questionType', function(key, action) {
				setTimeout(function() {
					var item = $.jStorage.get(reviewing?'currentItem':'l/currentQuizItem');
					if (!item || !item.kan)
						return;
					var quest = $('#question-type.reading');
					if (quest.length > 0) {
						var found = item.emph == 'kunyomi' ? 'Kun' : 'On';
						quest.html('<h1><strong>' + found + "'yomi</strong> Reading?</h1>");
					}
				}, 0);
			});
		}

		// Lightning
		var ltItemName = reviewing ? 'lightning' : 'lightningL';
		lightning = localStorage.getItem(ltItemName);
		if (lightning === 'false')
			lightning = false;
		$(reviewing ? '#summary-button' : '#header-buttons').append('<a id="lightning-mode" href="#"'+(lightning?' class="active"':'')+'><i class="icon-bolt"></i></a>');
		$('#lightning-mode').click(function() {
			lightning = !lightning;
			localStorage.setItem(ltItemName, lightning);
			$(this).toggleClass('active', lightning);
			return false;
		});
		var disableLightning = false;
		var observer = new WebKitMutationObserver(function(mutations) {
			if (!lightning)
				return;
			for (var idx in mutations) {
				var mut = mutations[idx].target;
				if (mut.tagName === 'FIELDSET') {
					correctAnswer = mut.className === 'correct';
					if (reviewing && !disableLightning && correctAnswer) {
						var ae = $('#answer-exception');
						if (ae.length > 0 && ae.hasClass('animated') && ae.text() === 'Your answer was a bit off. Check the meaning to make sure you are correct') {
							ae.removeClass('animated fadeInUp');
							setTimeout(function() {
								ae = $('#answer-exception');
								if (ae.length > 0 && !ae.hasClass('animated'))
									$('#answer-form button').click();
							}, 2000);
							// console.log(ae.text());
						} else {
							$('#answer-form button').click();
						}
					} else {
						$('#additional-content #option-item-info').click();
						disableLightning = false;
					}
					break;
				}
			}
		});
		observer.observe(document.getElementById(reviewing?'question':'quiz'), {attributes: true, subtree: true, attributeFilter: ['class']});
		$('#answer-form button').click(function(event) {
			if (event.which)
				disableLightning = true;
		});
	});
}
