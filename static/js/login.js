const abrirLogin = document.getElementById("abrirLogin");
const cerrarLogin = document.getElementById("cerrarLogin");

const modalLogin = document.getElementById("modalLogin");
const overlay = document.getElementById("overlay");

const contenedor = document.getElementById("contenedorPrincipal");

const password = document.getElementById("password");
const confirmarPassword = document.getElementById("confirmarPassword");

const passwordMatch = document.getElementById("passwordMatch");

const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");

const correo = document.getElementById("correo");
const correoEstado = document.getElementById("correoEstado");

const codigo = document.getElementById("codigo");
const codigoEstado = document.getElementById("codigoEstado");



abrirLogin.addEventListener("click", () => {

    modalLogin.classList.add("active");

    overlay.classList.add("active");

    contenedor.classList.add("blur");

});



function cerrarModal() {

    modalLogin.classList.remove("active");

    overlay.classList.remove("active");

    contenedor.classList.remove("blur");

}



cerrarLogin.addEventListener("click", cerrarModal);

overlay.addEventListener("click", cerrarModal);



function togglePassword(id) {

    const campo = document.getElementById(id);

    if (campo.type === "password") {

        campo.type = "text";

    } else {

        campo.type = "password";

    }

}



confirmarPassword.addEventListener("input", () => {

    if (confirmarPassword.value === "") {

        passwordMatch.textContent = "";

        return;

    }

    if (password.value === confirmarPassword.value) {

        passwordMatch.textContent =
            "Las contraseñas coinciden";

        passwordMatch.style.color = "#3DDC84";

    } else {

        passwordMatch.textContent =
            "Las contraseñas no coinciden";

        passwordMatch.style.color = "#FF5E5E";

    }

});



password.addEventListener("input", () => {

    const valor = password.value;

    let fuerza = 0;

    if (valor.length >= 8) {

        fuerza++;

    }

    if (/[A-Z]/.test(valor)) {

        fuerza++;

    }

    if (/[0-9]/.test(valor)) {

        fuerza++;

    }

    if (/[^A-Za-z0-9]/.test(valor)) {

        fuerza++;

    }

    switch (fuerza) {

        case 0:

            strengthBar.style.width = "0%";

            strengthText.textContent =
                "Seguridad de contraseña";

            break;

        case 1:

            strengthBar.style.width = "25%";

            strengthBar.style.background =
                "#FF5E5E";

            strengthText.textContent =
                "Contraseña débil";

            break;

        case 2:

            strengthBar.style.width = "50%";

            strengthBar.style.background =
                "#FFB347";

            strengthText.textContent =
                "Contraseña media";

            break;

        case 3:

            strengthBar.style.width = "75%";

            strengthBar.style.background =
                "#FFD700";

            strengthText.textContent =
                "Contraseña buena";

            break;

        case 4:

            strengthBar.style.width = "100%";

            strengthBar.style.background =
                "#3DDC84";

            strengthText.textContent =
                "Contraseña fuerte";

            break;

    }

});



correo.addEventListener("input", () => {

    const regex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (correo.value === "") {

        correoEstado.textContent = "";

        return;

    }

    if (regex.test(correo.value)) {

        correoEstado.textContent =
            "Correo válido";

        correoEstado.style.color =
            "#3DDC84";

    } else {

        correoEstado.textContent =
            "Correo inválido";

        correoEstado.style.color =
            "#FF5E5E";

    }

});



codigo.addEventListener("input", () => {

    if (codigo.value.trim() === "") {

        codigoEstado.textContent = "";

        return;

    }

    if (codigo.value.length >= 5) {

        codigoEstado.textContent =
            "Código listo para validar";

        codigoEstado.style.color =
            "#D4AF37";

    }

});



document.addEventListener("keydown", (e) => {

    if (
        e.key === "Escape" &&
        modalLogin.classList.contains("active")
    ) {

        cerrarModal();

    }

});



document
.getElementById("registroForm")
.addEventListener("submit", (e) => {

    if (
        password.value !==
        confirmarPassword.value
    ) {

        e.preventDefault();

        passwordMatch.textContent =
            "Las contraseñas no coinciden";

        passwordMatch.style.color =
            "#FF5E5E";

        return;

    }

});
