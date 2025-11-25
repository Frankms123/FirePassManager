var db = firebase.apps[0].firestore();
var auth = firebase.apps[0].auth();

function togglePassword() {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function socialLogin(platform) {
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

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    if (email && password.length >= 8) {
        auth.signInWithEmailAndPassword(email, password)
		.then((userCredential) => {
			const user = userCredential.user;
			const dt = new Date();
			db.collection("dataUser").where('iduser', '==', user.uid).get()
				.then(function (docRef) {
					docRef.forEach(function (doc){
						doc.ref.update({ultAcceso:dt}).then(function (){
							document.location.href = 'passManager.html';
						});
					});
				})
				.catch(function (FirebaseError) {
					var mensaje = "Error adding document: " + FirebaseError
					alert(mensaje);
				});
		})
		.catch((error) => {
			var mensaje = "Error user access: " + error.message;
			alert(mensaje);
		});
    } else {
        const errorMsg = document.getElementById('errorMessage');
        errorMsg.style.display = 'block';

        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 3000);
    }
});