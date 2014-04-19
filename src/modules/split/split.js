(function () {
	'use strict';

	var onDragEnterOrOver, getRandomColor, recalculate, getDropRegion;

	getRandomColor = function () {
		var letters, color, i;

		letters = '0123456789ABCDEF'.split('');
		color = '#';
		for (i = 0; i < 6; i += 1) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	};

	getDropRegion = function (x, y, width, height) {
		var relativeDistanceToBottom, relativeDistanceToRight,
			relativeDistanceToTop, relativeDistanceToLeft;

		relativeDistanceToLeft = x / width;
		relativeDistanceToTop = y / height;
		relativeDistanceToRight = (width - x) / width;
		relativeDistanceToBottom = (height - y) / height;

		if (
			relativeDistanceToLeft < relativeDistanceToTop &&
			relativeDistanceToLeft < relativeDistanceToBottom &&
			relativeDistanceToLeft < relativeDistanceToRight
			) {
			return 'left';
		} else if (
			relativeDistanceToTop < relativeDistanceToRight &&
			relativeDistanceToTop < relativeDistanceToBottom
		) {
			return 'top';
		} else if (relativeDistanceToBottom < relativeDistanceToRight) {
			return 'bottom';
		} else {
			return 'right';
		}
	};

	onDragEnterOrOver = function (e) {

		var x, y, height, width, offset, $this, $overlay, region;

		$this = $(this);

		if (e.originalEvent.offsetX) {
			x = e.originalEvent.offsetX;
			y = e.originalEvent.offsetY;
		} else {
			offset = $this.offset();
			x = e.originalEvent.pageX - offset.left;
			y = e.originalEvent.pageY - offset.top;
		}

		if (x < 0 || y < 0) {
			return;
		}

		$overlay = $this.find('.split-column-overlay');
		if (!$overlay.length) {
			$overlay = $('<div class="split-column-overlay"/>');
			setTimeout(
				function () {
					$this.append($overlay);
				}, 0
			);
		}

		width = $this.width();
		height = $this.height();

		region = getDropRegion(x, y, width, height);
		$overlay.data('region', region)
			.css({
				top: (region === 'bottom') ? '50%' : 0,
				bottom: (region === 'top') ? '50%' : 0,
				left: (region === 'right') ? '50%' : 0,
				right: (region === 'left') ? '50%' : 0
			});

		if (e.preventDefault) {
			e.preventDefault();
		}
		return false;
	};

	recalculate = function ($el) {

		var $rows, rowHeight;

		$rows = $el.find('.split-row');

		if (!$rows.length) {
			return;
		}

		rowHeight = 100 / $rows.length;

		$rows.each(function (index, el) {
			var $el, $columns, columnWidth;

			$el = $(el);
			$el.css('height', rowHeight + '%');

			$columns = $el.find('.split-column');

			if (!$columns.size()) {
				throw 'Rows should not be empty.';
			}

			columnWidth = 100 / $columns.size();
			$columns.each(function (index, el) {
				var $el;
				$el = $(el);
				$el.css('width', columnWidth + '%');

				if (!$el.hasClass('js-split-is-colored')) {
					$el.css('background-color', getRandomColor())
						.addClass('js-split-is-colored');
				}
			});
		});
	};

	define(['jquery'], function () {
		return {
			init: function ($el) {
				recalculate($el);

				$el.on('dragstart', '.split-column', function () {
					$(this).addClass('split-is-dragged');
					$el.on('dragenter dragover', '.split-column:not(.split-is-dragged)', onDragEnterOrOver);
				});

				$el.on('dragend', '.split-column', function () {
					var $this, $overlay, position, $dropTarget, removeRow;

					$el.off('dragenter dragover');

					$this = $(this);
					$this.removeClass('split-is-dragged');
					$overlay = $el.find('.split-column-overlay');

					if (!$overlay.length) {
						return;
					}

					$dropTarget = $overlay.parent();
					position = $overlay.data('region');
					$overlay.remove();

					removeRow = !$this.siblings().size();

					if (removeRow) {
						$this.parent().remove();
					}

					if (position === 'left') {
						$dropTarget.before($this);
					} else if (position === 'right') {
						$dropTarget.after($this);
					}

					recalculate($el);

				});

				$el.on('dragleave', '.split-column', function () {
					$(this).find('.split-column-overlay').remove();
				});

			}
		};
	});

}());
