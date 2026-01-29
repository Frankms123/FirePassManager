var db = firebase.apps[0].firestore();
var auth = firebase.apps[0].auth();

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function socialRegister(platform) {
    const termsAccepted = document.getElementById('invalidCheck').checked;
    if (!termsAccepted) {
        alert("Debes aceptar los Términos y Condiciones para continuar.");
        return;
    }

    var provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth()
        .signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            return saveUserIfNew(user);
        })
        .then(() => {
            document.location.href = "passManager.html";
        })
        .catch(error => {
            console.error(error);
            alert("Error al iniciar sesión: " + error.message);
        });
}

function saveUserIfNew(user) {
    db.collection("dataUser").doc(user.uid).set({
        iduser: user.uid,
        userName: user.displayName || "",
        email: user.email
    }, { merge: true });
}

document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const termsAccepted = document.getElementById('invalidCheck').checked;
    if (!termsAccepted) {
        alert("Debes aceptar los Términos y Condiciones para continuar.");
        return;
    }

    const name = document.getElementById('name').value
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres');
        return;
    }

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
		.then((userCredential) => {
			const user = userCredential.user;
			db.collection("dataUser").add({
				iduser: user.uid,
				userName: name,
				email: email,
			}).then(function (docRef) {
				alert("Usuario agregado satisfactoriamente");
                document.location.href = 'passManager.html';
			}).catch(function (FirebaseError) {
				alert("Error al registrar datos del usuario." + FirebaseError);
			});
		})
		.catch((error) => {
			alert("Error al agregar el nuevo usuario: " + error.message);
		});
});