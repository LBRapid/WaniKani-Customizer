var counted = 0;
var api_calls = ['radicals', 'kanji', 'vocabulary'];
var api_colors = ['#0096e7', '#ee00a1', '#9800e8'];

var curr_date = new Date();
var start_time = curr_date.getTime() / 1000;
var gHours = 12;
var graphH = 88;
var xOff = 18, vOff = 16;
var max_hours = 72;

var times, pastReviews, firstReview, tFrac;


// Helpers
function pluralize(noun, amount) {
	return amount + ' ' + (amount != 1 ? noun + 's' : noun);
}

function fuzzyMins(minutes) {
	if (minutes < 1 && minutes > 0) {
		var seconds = Math.round(minutes * 60);
		return pluralize('second', seconds);
	}
	minutes = Math.round(minutes);
	return pluralize('min', minutes);
}


// Draw
function drawBarRect(ctx, xo, yo, bw, bh, color) {
	ctx.fillStyle = color;
	ctx.fillRect(xo, yo, bw, bh);
}

function drawBar(ctx, time, height, hOff, color, tFrac, outlined) {
	var bx = xOff + time * tFrac, by = graphH - height - hOff;
	ctx.fillStyle = color;
	ctx.fillRect(bx, by, tFrac, height);
	if (outlined) {
		ctx.strokeStyle = (outlined === -1 ? '#ffffff' : '#000000');
		ctx.strokeRect(bx, by, tFrac, hOff === 0 ? graphH : height);
	}
}

function drawCanvas(clear) {
	var canvas = document.getElementById('c-timeline');
	if (canvas.getContext) {
		var totalCount = 0;
		var maxCount = 3;
		var graphTimeScale = 60 * 60 * (gHours - 0.1);
		if (gHours == 0) {
			if (pastReviews) {
				for (var ti = 0; ti < 3; ++ti) {
					totalCount += pastReviews[ti];
				}
				maxCount = totalCount;
			}
		} else {
			for (var time in times) {
				if (time * 60 * tRes < graphTimeScale) {
					var counts = times[time];
					if (counts) {
						var total = 0;
						for (var ti = 0; ti < 3; ++ti) {
							total += counts[ti];
						}
						if (total > maxCount)
							maxCount = total;
						totalCount += total;
					}
				}
			}
		}
		if (totalCount == 0)
			maxCount = 0;
		$('#g-timereviews').text(totalCount);

		tFrac = tRes * (page_width - xOff) / 60 / gHours;
		var ctx = canvas.getContext("2d");
		if (clear) {
			ctx.clearRect(0, 0, page_width, graphH);
			page_width = $('.span12 header').width();
		} else {
			var gTip = $('#graph-tip');
			var pidx;
			var canvasJQ = $('#c-timeline');
			canvas.addEventListener('mousemove', function(event) {
				if (gHours == 0)
					return;
				var idx = Math.floor((event.offsetX - xOff) / tFrac) + 1;
				if (idx !== pidx) {
					var counts = times[idx];
					if (counts) {
						gTip.show();
						var rCount = counts[0] + counts[1] + counts[2];
						var showTime = counts[4] * 1000;
						var minDiff = (showTime - new Date().getTime()) / 1000 / 60;
						var tDisplay;
						if (minDiff < 90) {
							tDisplay = fuzzyMins(minDiff);
						} else {
							var tDate = new Date(showTime);
							var hours = tDate.getHours();
							var mins = tDate.getMinutes();
							var suffix = '';
							if (options && options['12_hours_i']) {
								suffix = ' ' + (hours < 12 ? 'am' : 'pm');
								hours %= 12;
								if (hours == 0)
									hours = 12;
							}
							if (hours < 10)
								hours = '0' + hours;
							if (mins < 10)
								mins = '0' + mins;
							tDisplay = hours + ':' + mins + suffix;
						}
						var tText = tDisplay + '<br />' + pluralize('review', rCount);
						var currentType = counts[3];
						if (currentType) {
							tText += '<br /><em>';
							tText += currentType == -1 ? 'current level' : 'burning'
							tText += '</em>';
						}
						gTip.html(tText);
						gTip.css({
							left: canvasJQ.position().left + idx * tFrac + xOff,
							top: event.pageY - gTip.height() - 6
						});
					} else {
						gTip.hide();
					}
					pidx = idx;
				} else {
					gTip.css('top', event.pageY - gTip.height() - 6);
				}
			}, false);
			canvasJQ.mouseleave(function(event) {
				gTip.hide();
				pidx = null;
			});
		}
		canvas.width = page_width;

		var hrsFrac = gHours / 3;
		ctx.lineWidth = tFrac / 20;
		ctx.strokeStyle = "#ffffff";
		ctx.textBaseline = 'top';
		ctx.textAlign = 'right';
		ctx.font = '12px sans-serif';
		ctx.fillStyle = '#e4e4e4';
		if (gHours != 0)
			ctx.fillRect(0, Math.floor((vOff + graphH) * 0.5), page_width, 1);
		ctx.fillRect(0, vOff - 1, page_width, 1);

		ctx.fillStyle = '#505050';
		ctx.textAlign = 'right';
		ctx.fillText(maxCount, xOff - 4, vOff + 1);

		ctx.fillStyle = '#d4d4d4';
		ctx.fillRect(xOff - 2, 0, 1, graphH);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(xOff - 1, 0, 1, graphH);

		if (gHours == 0) {
			if (pastReviews) {
				var gOff = xOff;
				var height = graphH - vOff;
				for (var ti = 0; ti < 3; ++ti) {
					var count = pastReviews[ti];
					if (count > 0) {
						var width = Math.ceil(count / maxCount * (page_width - xOff));
						drawBarRect(ctx, gOff, vOff, width, height, api_colors[ti]);
						gOff += width;
					}
				}
			}
		} else {
			for (var i = 1; i < 4; ++i) {
				var xP = Math.floor(i / 3 * (page_width - 2));
				if (i == 3) {
					xP += 1;
				} else if (page_width > 1100) {
					--xP;
				}
				ctx.fillStyle = '#e4e4e4';
				ctx.fillRect(xP, 0, 1, graphH);
				ctx.fillStyle = '#505050';
				ctx.fillText('' + hrsFrac * i, xP - 2, 0);
			}
			for (var time in times) {
				var counts = times[time];
				if (!counts)
					continue;
				var hOff = 0;
				var currentType = counts[3];
				if (currentType) {
					drawBar(ctx, time-1, graphH - vOff, 0, 'rgba(' + (currentType == -1 ? '255, 255, 255' : '0, 0, 0') + ', 0.33)', tFrac);
				}
				for (var ti = 0; ti < 3; ++ti) {
					var count = counts[ti];
					if (count > 0) {
						var height = Math.ceil(count / maxCount * (graphH - vOff));
						drawBar(ctx, time-1, height, hOff, api_colors[ti], tFrac, currentType);
						hOff += height;
					}
				}
			}
		}
	}
}

function initCanvas() {
	var reviewHours = Math.ceil(firstReview / 60 / 60 / 6) * 6;
	if (reviewHours > gHours) {
		gHours = reviewHours;
		$('#g-timeframe').text(gHours);
	}
	if (firstReview > 3 * 60 * 60)
		$('#g-range').attr('min', reviewHours);
	$('#r-timeline').show();
	$('section.review-status').css('border-top', '1px solid #fff');
	drawCanvas();
}


// Load data
function addData(data) {
	var response = data.requested_information;
	if (response) {
		if (response.general)
			response = response.general;
		var myLevel = data.user_information.level;
		var firstItem = response[0];
		var typeIdx = firstItem.kana ? 2 : firstItem.important_reading ? 1 : 0;
		var maxSeconds = 60 * 60 * max_hours;
		for (var itemIdx in response) {
			var item = response[itemIdx];
			var stats = item.user_specific;
			if (stats && !stats.burned) {
				var availableAt = stats.available_date;
				var tDiff = availableAt - start_time;
				if (tDiff < maxSeconds) {
					if (tDiff < firstReview)
						firstReview = tDiff;
					var timeIdx = tDiff < 1 ? -1 : Math.round(tDiff / 60 / tRes) + 1;
					var timeTable;
					if (tDiff < 0) {
						if (!pastReviews)
							pastReviews = [0, 0, 0, 0, availableAt];
						timeTable = pastReviews;
					} else {
						timeTable = times[timeIdx];
					}
					if (!timeTable) {
						times[timeIdx] = [0, 0, 0, 0, availableAt];
						timeTable = times[timeIdx];
					} else if (availableAt < timeTable[4]) {
						timeTable[4] = availableAt;
					}
					++timeTable[typeIdx];
					if (typeIdx < 2 && item.level == myLevel && stats.srs == 'apprentice') {
						timeTable[3] = -1;
					} else if (stats.srs == 'enlighten') {
						timeTable[3] = -2;
					}
				}
			}
		}
		if (++counted == 3) {
			localStorage.setItem('reviewCache', JSON.stringify(times));
			localStorage.setItem('pastCache', JSON.stringify(pastReviews));
			localStorage.setItem('cacheExpiration', curr_date.getTime());
			initCanvas();
		}
	}
}

function insertTimeline(path) {
	apiKey = localStorage.getItem('apiKey');
	if (apiKey && apiKey.length == 32) {
		$('section.review-status').before('<section id="r-timeline" style="display: none;"><h4>Reviews Timeline</h4><a class="help">?</a><form id="graph-form"><label><span id="g-timereviews"></span> reviews <span id="g-timeframe">in '+gHours+' hours</span> <input id="g-range" type="range" min="0" max="'+max_hours+'" value="'+gHours+'" step="6" name="g-ranged"></label></form><div id="graph-tip" style="display: none;"></div><canvas id="c-timeline" height="'+graphH+'"></canvas></section>');
		try {
			times = JSON.parse(localStorage.getItem('reviewCache'));
			pastReviews = JSON.parse(localStorage.getItem('pastCache'));
		} catch(e) {
		}
		if (times && pastReviews) {
			var cacheExpires = localStorage.getItem('cacheExpiration');
			if (cacheExpires && curr_date - cacheExpires > 60 * 60 * 1000)
				times = null;
		}
		if (!times || !pastReviews) {
			times = null;
			pastReviews = null;
			localStorage.setItem('reviewCache', null);
			localStorage.setItem('pastCache', null);
			times = [];
			firstReview = Number.MAX_VALUE;
			for (var ext in api_calls) {
				$.ajax({
					type: 'get',
					url: '/api/v1.2/user/' + apiKey + '/' + api_calls[ext],
					success: addData
				});
			}
		} else {
			for (var idx in times) {
				var counts = times[idx];
				if (counts) {
					firstReview = counts[4] - start_time;
					break;
				}
			}
			setTimeout(initCanvas, 0);
		}
		$('a.help').click(function() {
			alert('Reviews Timeline - Displays your upcoming reviews\nY-axis: Number of reviews\nX-axis: Time (scale set by the slider)\n\nThe number in the upper left shows the maximum number of reviews in a single bar. White-backed bars indicate that review group contains radicals/kanji necessary for advancing your current level.');
		});
		$('#g-range').change(function() {
			gHours = $(this).val();
			if (gHours < 6)
				gHours = pastReviews ? 0 : 3;
			$('#g-timeframe').text(gHours == 0 ? 'right now' : 'in ' + gHours + ' hours');
			drawCanvas(true);
		});
	} else {
		alert('Hang on! We\'re grabbing your API key for the Reviews Timeline. We should only need to do this once.');
		document.location.pathname = '/account';
	}
}
