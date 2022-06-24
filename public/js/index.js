(function() {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.validation-required')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function(form) {
            form.addEventListener('submit', function(event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }

                form.classList.add('was-validated')
            }, false)
        })
})();

function editProfile() {
    document.getElementById("input_box").style.display = "none";
    document.getElementsByClassName("editForm")[0].style.display = "block";
}

function cancelProfile() {
    document.getElementById("input_box").style.display = "block";
    document.getElementsByClassName("editForm")[0].style.display = "none";
}