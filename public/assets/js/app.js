if (document.title === 'Home') {
	$('.home').addClass('active');
	$('.home').css('color', '#f7941d');
} else if (document.title === 'Books Exhibition') {
	$('.all').addClass('active');
	$('.all').css('color', '#f7941d');
} else if (document.title === 'New Books') {
	$('.new').addClass('active');
	$('.new').css('color', '#f7941d');
} else if (document.title === 'About') {
	$('.about').addClass('active');
	$('.about').css('color', '#f7941d');
} else if (document.title === 'Events') {
	$('.events').addClass('active');
	$('.events').css('color', '#f7941d');
}

if (document.title !== 'Events') {
	if (window.innerWidth <= `${550}px`) {
		document.querySelector(
			'#searcForm2'
		).style.display =
			'block';
		document.querySelector('#searcForm').style.display =
			'none';
	}
} else {
	document.querySelector('#searcForm').style.display =
		'none';
	document.querySelector('#searcForm2').style.display =
		'none';
}

// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
	'use strict';

	// Fetch all the forms we want to apply custom Bootstrap validation styles to
	const forms = document.querySelectorAll(
		'.validationForm'
	);

	// Loop over them and prevent submission
	Array.from(forms).forEach(function (form) {
		form.addEventListener(
			'submit',
			function (event) {
				if (!form.checkValidity()) {
					event.preventDefault();
					event.stopPropagation();
				}

				form.classList.add('was-validated');
			},
			false
		);
	});
})();

document.getElementById(
	'eventDate'
).value = new Date().toDateInputValue();
