'use strict';

const formWrapper = document.getElementById('form-todo-wrapper');
const formTodo = document.getElementById('form-todo');
const formInput = document.getElementById('form-input');
const openBtn = document.getElementById('open-btn');
const addBtn = document.getElementById('add');
const todoList = document.getElementById('todo-list');
const todo = document.getElementById('todo');
const warning = document.getElementById('warning');
const elemWarning = showWarning();

openBtn.addEventListener('click', openForm);
formTodo.addEventListener('submit', addTask);

// Проверяем локальное хранилище
if (localStorage.getItem('todo-items')) {

	let items = localStorage.getItem('todo-items');
	todoList.innerHTML = items;

	let todoItems = document.querySelectorAll('.item');
	todoItems.forEach(item => {
		let checkbox = item.querySelector('.item-buttons__checkbox');
		let close = item.querySelector('.item-buttons__close');
		checkbox.classList.contains('checked') ? checkbox.checked = true : checkbox.checked = false;
		checkbox.addEventListener('click', markTaskCompleted);
		close.addEventListener('click', deleteTask);
		item.addEventListener('pointerdown', onPointerDown);
	});
}

// Сохраняем ширину элементов задач при ресайзе окна
window.addEventListener('resize', () => {
	let items = document.querySelectorAll('.item');
	for (let i = 0; i < items.length; i++) {
		items[i].style.maxWidth = `${todoList.offsetWidth}px`;
	}
});

// Закрыть форму ввода при нажатии клавиши Esc
document.addEventListener('keyup', (e) => {
	if (e.code === 'Escape') {
		openBtn.classList.remove('active');
		formWrapper.classList.remove('active');
	}
});

// Открыть/закрыть форму
function openForm(e) {
	openBtn.classList.toggle('active');
	formWrapper.classList.toggle('active');
	formInput.value = '';
	if (openBtn.classList.contains('active')) {
		setTimeout(() => {
			formInput.focus();
		}, 300);
	}
}

// Показать сообщение, в случае ввода пустой строки
function showWarning() {
	let flag = true;
	function f() {
		warning.classList.add('active');
		if (flag) {
			flag = false;
			setTimeout(() => {
				warning.classList.remove('active');
				flag = true;
			}, 2500);
		}
	}
	return f;
}

// Создаём элемент задачи
function createTaskItem(text) {
	let item = document.createElement('li');
	item.className = 'todo__item item';

	let itemBody = document.createElement('div');
	itemBody.className = 'item__body';

	let itemColumn1 = document.createElement('div');
	itemColumn1.className = 'item__column item__column_1';

	let itemColumn2 = document.createElement('div');
	itemColumn2.className = 'item__column item__column_2';

	let title = document.createElement('h2');
	title.className = 'item__title';
	title.innerHTML = text;

	let itemButtons = document.createElement('div');
	itemButtons.className = 'item-buttons';

	let itemButtonsCheckedBtns = document.createElement('div');
	itemButtonsCheckedBtns.className = 'item-buttons__checked-btns';

	let checkbox = document.createElement('input');
	checkbox.className = 'item-buttons__checkbox';
	checkbox.type = 'checkbox';

	let customCheckbox = document.createElement('div');
	customCheckbox.className = 'item-buttons__customcheckbox';

	let close = document.createElement('button');
	close.className = 'item-buttons__close';

	let faCheck = document.createElement('i');
	faCheck.className = 'fas fa-check';

	customCheckbox.append(faCheck);
	itemButtonsCheckedBtns.append(checkbox, customCheckbox);
	itemButtons.append(itemButtonsCheckedBtns, close);
	itemColumn2.append(itemButtons);
	itemColumn1.append(title);
	itemBody.append(itemColumn1, itemColumn2);
	item.append(itemBody);

	checkbox.addEventListener('click', markTaskCompleted);
	close.addEventListener('click', deleteTask);
	item.addEventListener('pointerdown', onPointerDown);

	toLocal();
	return item;
}

// Добавить задачу
function addTask(e) {
	e.preventDefault();
	formInput.focus();
	let isRightInput = formInput.value.trim();
	if (isRightInput) {
		let item = createTaskItem(formInput.value);
		todoList.append(item);
		formInput.value = '';
		toLocal();
	} else {
		elemWarning();
	}
}

// Пометить задачу как выполненная
function markTaskCompleted(e) {
	let checkbox = this;
	let item = checkbox.closest('.item');
	if (checkbox.checked) {
		checkbox.classList.add('checked');
		item.classList.add('completed');
		toLocal();
	} else {
		checkbox.classList.remove('checked');
		item.classList.remove('completed');
		toLocal();
	}
}

// Удалить задачу
function deleteTask() {
	let item = this.closest('.item');
	item.remove();
	toLocal();
}

// Функции перетаскивания
function onPointerDown(e) {
	// Запрещаем перетаскивание если пользователь кликнул на кнопку check или close
	if (e.target.closest('.item-buttons__checkbox') || e.target.closest('.item-buttons__close')) return;

	// Добавляем необходимые переменные
	let item = e.target.closest('.item');
	let list = item.parentNode;
	let items = document.querySelectorAll('.item');

	// Создаем клон item
	let cloneItem = item.cloneNode(true);
	cloneItem.setAttribute('data-clone', true);
	cloneItem.style.opacity = 0.4;
	cloneItem.style.zIndex = 50;

	// Получаем координаты Item, ширину и высоту в переменные
	let coords = item.getBoundingClientRect();
	let width = item.offsetWidth;
	let height = item.offsetHeight;

	// Вычисляем сдвиг по X и Y осям
	let shiftX = e.clientX - coords.x;
	let shiftY = e.clientY - coords.y;

	// Устанавливаем абсолютное позиционирование, координаты и размеры
	item.style.position = 'absolute';
	item.style.left = e.clientX - shiftX + 'px';
	item.style.top = e.pageY - shiftY + 'px'; // координата относительно документа, а не окна (*)
	item.style.width = `100%`;
	item.style.maxWidth = `${width}px`;
	item.style.height = `${height}px`;
	item.style.zIndex = 100;
	item.style.cursor = 'grabbing';

	// Добавляем клон Item, на место самого Item, при перетаскивании
	list.insertBefore(cloneItem, item);

	// Обработчики на движение и отпускание кнопки мыши
	document.addEventListener('pointermove', onPointerMove);
	document.addEventListener('pointerup', onPointerUp);

	function onPointerMove(e) {
		e.preventDefault();

		// Координаты перемещения Item
		let newX = e.clientX - shiftX;
		let newY = e.pageY - shiftY;
		item.style.left = `${newX}px`;
		item.style.top = `${newY}px`;

		// Получаем координаты верхней и нижней границы Item 
		let itemTop = item.getBoundingClientRect().top;
		let itemBottom = itemTop + item.offsetHeight;

		// Если граница Item достигла верха или низа окна, производим скролл
		if (itemTop <= 0) {
			window.scrollBy(0, itemTop);
		}
		if (itemBottom >= document.documentElement.offsetHeight) {
			let scrollBottom = Math.abs(document.documentElement.offsetHeight - itemBottom);
			window.scrollBy(0, scrollBottom);
		}

		// Скрываем Item, т.к. по умолчанию он является элементом под курсором / получаем элемент под ним
		item.hidden = true;
		let elemBelow = document.elementFromPoint(e.clientX, e.clientY);
		item.hidden = false;

		// Если курсор за пределами окна, выходим из функции
		if (!elemBelow) {
			return;
		}

		elemBelow = elemBelow.closest('.item');

		// Устанавливаем элементу под курсором прозрачность
		if (elemBelow && !elemBelow.closest('[data-clone="true"]')) {
			elemBelow.classList.add('below');
		} else {
			removeClassBelow(items);
		}

		// Проверяем, если элемент под курсором равен null/undefined или является клоном перетаскиваемого элемента Item, выходим из функции
		if (!elemBelow || elemBelow.closest('[data-clone="true"]')) {
			return;
		}

		// Переставляем Item "на ходу", если курсор достиг центра элемента под курсором(elemBelow)
		if (elemBelow.nextElementSibling === item) {
			if (!getNextElement(e.clientY, elemBelow)) {
				list.insertBefore(cloneItem, elemBelow);
				list.insertBefore(item, elemBelow);
			}
		} else {
			if (getNextElement(e.clientY, elemBelow)) {
				list.insertBefore(cloneItem, elemBelow.nextElementSibling);
				list.insertBefore(item, elemBelow.nextElementSibling);
			}
		}




	}

	function onPointerUp(e) {
		// Меняем позицию элемента Item, удаляем клон и классы "below". Снимаем обработчики с событий
		item.style.cursor = 'grab';
		item.style.position = 'static';
		cloneItem.remove();
		removeClassBelow(items);
		document.removeEventListener('pointermove', onPointerMove);
		document.removeEventListener('pointerup', onPointerUp);
		toLocal();
	}

	// Отмена перетаскивания по умолчанию
	item.ondragstart = function () {
		return false;
	};

}

// Удаляем класс below всем элементам
function removeClassBelow(elems) {
	for (let i = 0; i < elems.length; i++) {
		elems[i].classList.remove('below');
	}
}

// Проверяем выше или ниже центра элемента(elemBelow) находится курсор с захватываемым Item
function getNextElement(cursorPosition, elem) {
	let centerElem = elem.getBoundingClientRect().top + (elem.offsetHeight / 2);
	return cursorPosition > centerElem ? true : false;
}

// Добавляем задачи в локальное хранилище
function toLocal() {
	let items = todoList.innerHTML;
	localStorage.setItem('todo-items', items);
}































