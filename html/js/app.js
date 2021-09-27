(function(){
	let MenuTpl =
		'<div id="menu_{{_namespace}}_{{_name}}" class="menu{{#align}} align-{{align}}{{/align}}">' +
			'<div class="head"><span>{{{title}}}</span></div>' +
				'<div class="menu-items">' +
					'{{#elements}}' +
						'<div class="menu-item {{#selected}}selected{{/selected}}">' +
							'{{{label}}}{{#isSlider}} : &lt;{{{sliderLabel}}}&gt;{{/isSlider}}' +
						'</div>' +
					'{{/elements}}' +
				'</div>'+
			'</div>' +
		'</div>'
	;

	window.QBCore_MENU = {};
	QBCore_MENU.ResourceName = 'qb-menu-default';
	QBCore_MENU.opened = {};
	QBCore_MENU.focus = [];
	QBCore_MENU.pos = {};

	QBCore_MENU.open = function(namespace, name, data) {
		if (typeof QBCore_MENU.opened[namespace] == 'undefined') {
			QBCore_MENU.opened[namespace] = {};
		}

		if (typeof QBCore_MENU.opened[namespace][name] != 'undefined') {
			QBCore_MENU.close(namespace, name);
		}

		if (typeof QBCore_MENU.pos[namespace] == 'undefined') {
			QBCore_MENU.pos[namespace] = {};
		}

		for (let i=0; i<data.elements.length; i++) {
			if (typeof data.elements[i].type == 'undefined') {
				data.elements[i].type = 'default';
			}
		}

		data._index = QBCore_MENU.focus.length;
		data._namespace = namespace;
		data._name = name;

		for (let i=0; i<data.elements.length; i++) {
			data.elements[i]._namespace = namespace;
			data.elements[i]._name = name;
		}

		QBCore_MENU.opened[namespace][name] = data;
		QBCore_MENU.pos[namespace][name] = 0;

		for (let i=0; i<data.elements.length; i++) {
			if (data.elements[i].selected) {
				QBCore_MENU.pos[namespace][name] = i;
			} else {
				data.elements[i].selected = false;
			}
		}

		QBCore_MENU.focus.push({
			namespace: namespace,
			name: name
		});

		QBCore_MENU.render();
		$('#menu_' + namespace + '_' + name).find('.menu-item.selected')[0].scrollIntoView();
	};

	QBCore_MENU.close = function(namespace, name) {
		delete QBCore_MENU.opened[namespace][name];

		for (let i=0; i<QBCore_MENU.focus.length; i++) {
			if (QBCore_MENU.focus[i].namespace == namespace && QBCore_MENU.focus[i].name == name) {
				QBCore_MENU.focus.splice(i, 1);
				break;
			}
		}

		QBCore_MENU.render();
	};

	QBCore_MENU.render = function() {
		let menuContainer = document.getElementById('menus');
		let focused = QBCore_MENU.getFocused();
		menuContainer.innerHTML = '';
		$(menuContainer).hide();

		for (let namespace in QBCore_MENU.opened) {
			for (let name in QBCore_MENU.opened[namespace]) {
				let menuData = QBCore_MENU.opened[namespace][name];
				let view = JSON.parse(JSON.stringify(menuData));

				for (let i=0; i<menuData.elements.length; i++) {
					let element = view.elements[i];

					switch (element.type) {
						case 'default': break;

						case 'slider': {
							element.isSlider = true;
							element.sliderLabel = (typeof element.options == 'undefined') ? element.value : element.options[element.value];

							break;
						}

						default: break;
					}

					if (i == QBCore_MENU.pos[namespace][name]) {
						element.selected = true;
					}
				}

				let menu = $(Mustache.render(MenuTpl, view))[0];
				$(menu).hide();
				menuContainer.appendChild(menu);
			}
		}

		if (typeof focused != 'undefined') {
			$('#menu_' + focused.namespace + '_' + focused.name).show();
		}

		$(menuContainer).show();

	};

	QBCore_MENU.submit = function(namespace, name, data) {
		$.post('http://' + QBCore_MENU.ResourceName + '/menu_submit', JSON.stringify({
			_namespace: namespace,
			_name: name,
			current: data,
			elements: QBCore_MENU.opened[namespace][name].elements
		}));
	};

	QBCore_MENU.cancel = function(namespace, name) {
		$.post('http://' + QBCore_MENU.ResourceName + '/menu_cancel', JSON.stringify({
			_namespace: namespace,
			_name: name
		}));
	};

	QBCore_MENU.change = function(namespace, name, data) {
		$.post('http://' + QBCore_MENU.ResourceName + '/menu_change', JSON.stringify({
			_namespace: namespace,
			_name: name,
			current: data,
			elements: QBCore_MENU.opened[namespace][name].elements
		}));
	};

	QBCore_MENU.getFocused = function() {
		return QBCore_MENU.focus[QBCore_MENU.focus.length - 1];
	};

	window.onData = (data) => {
		switch (data.action) {

			case 'openMenu': {
				QBCore_MENU.open(data.namespace, data.name, data.data);
				break;
			}

			case 'closeMenu': {
				QBCore_MENU.close(data.namespace, data.name);
				break;
			}

			case 'controlPressed': {
				switch (data.control) {

					case 'ENTER': {
						let focused = QBCore_MENU.getFocused();

						if (typeof focused != 'undefined') {
							let menu = QBCore_MENU.opened[focused.namespace][focused.name];
							let pos = QBCore_MENU.pos[focused.namespace][focused.name];
							let elem = menu.elements[pos];

							if (menu.elements.length > 0) {
								QBCore_MENU.submit(focused.namespace, focused.name, elem);
							}
						}

						break;
					}

					case 'BACKSPACE': {
						let focused = QBCore_MENU.getFocused();

						if (typeof focused != 'undefined') {
							QBCore_MENU.cancel(focused.namespace, focused.name);
						}

						break;
					}

					case 'TOP': {
						let focused = QBCore_MENU.getFocused();

						if (typeof focused != 'undefined') {
							let menu = QBCore_MENU.opened[focused.namespace][focused.name];
							let pos = QBCore_MENU.pos[focused.namespace][focused.name];

							if (pos > 0) {
								QBCore_MENU.pos[focused.namespace][focused.name]--;
							} else {
								QBCore_MENU.pos[focused.namespace][focused.name] = menu.elements.length - 1;
							}

							let elem = menu.elements[QBCore_MENU.pos[focused.namespace][focused.name]];

							for (let i=0; i<menu.elements.length; i++) {
								if (i == QBCore_MENU.pos[focused.namespace][focused.name]) {
									menu.elements[i].selected = true;
								} else {
									menu.elements[i].selected = false;
								}
							}

							QBCore_MENU.change(focused.namespace, focused.name, elem);
							QBCore_MENU.render();

							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}

						break;
					}

					case 'DOWN': {
						let focused = QBCore_MENU.getFocused();

						if (typeof focused != 'undefined') {
							let menu = QBCore_MENU.opened[focused.namespace][focused.name];
							let pos = QBCore_MENU.pos[focused.namespace][focused.name];
							let length = menu.elements.length;

							if (pos < length - 1) {
								QBCore_MENU.pos[focused.namespace][focused.name]++;
							} else {
								QBCore_MENU.pos[focused.namespace][focused.name] = 0;
							}

							let elem = menu.elements[QBCore_MENU.pos[focused.namespace][focused.name]];

							for (let i=0; i<menu.elements.length; i++) {
								if (i == QBCore_MENU.pos[focused.namespace][focused.name]) {
									menu.elements[i].selected = true;
								} else {
									menu.elements[i].selected = false;
								}
							}

							QBCore_MENU.change(focused.namespace, focused.name, elem);
							QBCore_MENU.render();

							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}

						break;
					}

					case 'LEFT': {
						let focused = QBCore_MENU.getFocused();

						if (typeof focused != 'undefined') {
							let menu = QBCore_MENU.opened[focused.namespace][focused.name];
							let pos = QBCore_MENU.pos[focused.namespace][focused.name];
							let elem = menu.elements[pos];

							switch(elem.type) {
								case 'default': break;

								case 'slider': {
									let min = (typeof elem.min == 'undefined') ? 0 : elem.min;

									if (elem.value > min) {
										elem.value--;
										QBCore_MENU.change(focused.namespace, focused.name, elem);
									}

									QBCore_MENU.render();
									break;
								}

								default: break;
							}

							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}

						break;
					}

					case 'RIGHT': {
						let focused = QBCore_MENU.getFocused();

						if (typeof focused != 'undefined') {
							let menu = QBCore_MENU.opened[focused.namespace][focused.name];
							let pos = QBCore_MENU.pos[focused.namespace][focused.name];
							let elem = menu.elements[pos];

							switch(elem.type) {
								case 'default': break;

								case 'slider': {
									if (typeof elem.options != 'undefined' && elem.value < elem.options.length - 1) {
										elem.value++;
										QBCore_MENU.change(focused.namespace, focused.name, elem);
									}

									if (typeof elem.max != 'undefined' && elem.value < elem.max) {
										elem.value++;
										QBCore_MENU.change(focused.namespace, focused.name, elem);
									}

									QBCore_MENU.render();
									break;
								}

								default: break;
							}

							$('#menu_' + focused.namespace + '_' + focused.name).find('.menu-item.selected')[0].scrollIntoView();
						}

						break;
					}

					default: break;
				}

				break;
			}
		}
	};

	window.onload = function(e){
		window.addEventListener('message', (event) => {
			onData(event.data);
		});
	};

})();
