(function () {
	'use strict';

	var onDragEnterOrOver, getRandomColor, recalculate;

	getRandomColor = function () {
		var letters, color, i;

		letters = '0123456789ABCDEF'.split('');
		color = '#';
		for (i = 0; i < 6; i += 1) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	};

	onDragEnterOrOver = function (e) {

		var x, y, height, width, offset, $this, distanceToBottom, distanceToRight, $overlay;

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

		width = $this.width();
		height = $this.height();

		distanceToRight = width - x;
		distanceToBottom = height - y;

		$overlay = $this.find('.split-column-overlay');
		if (!$overlay.length) {
			$overlay = $('<div class="split-column-overlay"/>');
			setTimeout(
				function () {
					$this.append($overlay);
				}, 0
			);
		}

		if (x < y && x < distanceToBottom && x < distanceToRight) {
			$overlay.css({
				top: 0,
				bottom: 0,
				left: 0,
				right: '50%'
			}).data('position', 'left');
		} else if (y < distanceToRight && y < distanceToBottom) {
			$overlay.css({
				top: 0,
				bottom: '50%',
				left: 0,
				right: 0
			}).data('position', 'top');
		} else if (distanceToBottom < distanceToRight) {
			$overlay.css({
				top: '50%',
				bottom: 0,
				left: 0,
				right: 0
			}).data('position', 'bottom');
		} else {
			$overlay.css({
				top: 0,
				bottom: 0,
				left: '50%',
				right: 0
			}).data('position', 'right');
		}

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
					position = $overlay.data('position');
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
