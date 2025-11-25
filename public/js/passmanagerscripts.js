var db = firebase.apps[0].firestore();
var auth = firebase.apps[0].auth();

let passwords = [];
let editingId = null;

// #region Cargar aplicación
window.onload = function () {
    loadPasswords();
    updateCategoryFilter();
};
// #endregion

// #region CRUD
function loadPasswords() {
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            alert("Debe iniciar sesión primero");
            return;
        }

        db.collection("dataPassword")
            .where("uid", "==", user.uid)
            .get()
            .then(query => {
                query.forEach(doc => {
                    let password = doc.data()
                    password.id = doc.id
                    passwords.push(password);
                });

                renderPasswords();
            });
    });
}

function savePassword() {
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            alert("Debe iniciar sesión primero");
            console.dir(auth);
            return;
        }

        const id = document.getElementById('passwordId').value
        const website = document.getElementById('website').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const category = document.getElementById('category').value;
        const expiryDateInput = document.getElementById('expiryDate').value;
        const notes = document.getElementById('notes').value;

        const expiryDate = expiryDateInput ? firebase.firestore.Timestamp.fromDate(new Date(expiryDateInput)) : null;

        if (!website || !password || !category) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }

        if (id) {
            db.collection("dataPassword").doc(id).update({
                website: website,
                username: username,
                password: password,
                category: category,
                expiryDate: expiryDate,
                notes: notes
            })
            .then(() => {
                alert("Contraseña actualizada correctamente");
            })
            .catch(error => {
                alert("Error al actualizar: " + error);
            });
        } else {
            db.collection("dataPassword").add({
                website: website,
                username: username,
                password: password,
                category: category,
                expiryDate: expiryDate,
                notes: notes,
                uid: user.uid
            }).then(function (docRef) {
                alert("Contraseña guardada");
            }).catch(function (FirebaseError) {
                alert("Error al guardar la contraseña: " + FirebaseError);
            });
        }

        loadPasswords();
        updateCategoryFilter();
        bootstrap.Modal.getInstance(document.getElementById('addPasswordModal')).hide();
        document.getElementById('passwordForm').reset();
        editingId = null;
    });
}

function editPassword(id) {
    const password = passwords.find(p => p.id === id);
    document.getElementById('passwordId').value = password.id;
    document.getElementById('website').value = password.website;
    document.getElementById('username').value = password.username || '';
    document.getElementById('password').value = password.password;
    document.getElementById('category').value = password.category;
    document.getElementById('expiryDate').value = formatDate(password.expiryDate) || '';
    document.getElementById('notes').value = password.notes || '';
    document.getElementById('modalTitle').textContent = 'Editar Contraseña';
    new bootstrap.Modal(document.getElementById('addPasswordModal')).show();
}

function deletePassword(docId) {
    if (confirm('¿Estás seguro de eliminar esta contraseña?')) {
        db.collection("dataPassword")
            .doc(docId)
            .delete()
            .then(() => {
                alert("Contraseña eliminada correctamente");
                loadPasswords();
                updateCategoryFilter();
            })
            .catch(error => {
                alert("Error al eliminar: " + error);
            });
    }
}
// #endregion

// #region Share Password
function sharePassword(id) {
    const password = passwords.find(p => p.id === id);
    document.getElementById('shareWebsite').textContent = password.website;
    editingId = id;
    new bootstrap.Modal(document.getElementById('shareModal')).show();
}

function confirmShare() {
    const email = document.getElementById('shareEmail').value;
    if (!email) {
        alert('Ingresa un email válido');
        return;
    }
    alert(`Contraseña compartida con ${email}`);
    bootstrap.Modal.getInstance(document.getElementById('shareModal')).hide();
    document.getElementById('shareEmail').value = '';
}
// #endregion

// #region UX / UI
function renderPasswords() {
    const container = document.getElementById('passwordsList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = passwords.filter(p => {
        const matchesSearch = p.website.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm) || p.notes.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || p.category === categoryFilter;
        const matchesStatus = !statusFilter || getPasswordStatus(p.expiryDate) === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = '';
        document.getElementById('emptyState').style.display = 'block';
        return;
    }

    document.getElementById('emptyState').style.display = 'none';
    container.innerHTML = filtered.map(p => {
        const status = getPasswordStatus(p.expiryDate);
        const statusClass = status === 'expired' ? 'expired' : status === 'expiring' ? 'expiring-soon' : 'safe';
        const categoryColor = getCategoryColor(p.category);

        return `
                    <div class="password-card ${statusClass}">
                        <div class="row align-items-center">
                            <div class="col-md-4">
                                <h5 class="mb-1"><i class="fas fa-globe"></i> ${p.website}</h5>
                                ${p.username ? `<small class="text-muted">Usuario: ${p.username}</small><br>` : ''}
                                <span class="category-badge" style="background: ${categoryColor}20; color: ${categoryColor}">
                                    ${p.category}
                                </span>
                            </div>
                            <div class="col-md-4">
                                <span class="password-display" id="pwd-${p.id}">••••••••</span>
                                <button class="btn btn-sm btn-outline-secondary" onclick="togglePassword('${p.id}', '${p.password}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick="copyPassword('${p.password}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                                ${p.expiryDate ? `<br><small class="text-muted">Vence: ${formatDate(p.expiryDate)}</small>` : ''}
                            </div>
                            <div class="col-md-4 text-end">
                                <button class="btn btn-sm btn-success btn-action" onclick="editPassword('${p.id}')">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="btn btn-sm btn-info btn-action" onclick="sharePassword('${p.id}')">
                                    <i class="fas fa-share"></i> Compartir
                                </button>
                                <button class="btn btn-sm btn-danger btn-action" onclick="deletePassword('${p.id}')">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                        ${p.notes ? `<div class="mt-2"><small><strong>Notas:</strong> ${p.notes}</small></div>` : ''}
                    </div>
                `;
    }).join('');
}

function updateCategoryFilter() {
    const categories = [...new Set(passwords.map(p => p.category))];
    const select = document.getElementById('categoryFilter');
    const datalist = document.getElementById('categoryList');

    select.innerHTML = '<option value="">Todas las categorías</option>' +
        categories.map(c => `<option value="${c}">${c}</option>`).join('');

    datalist.innerHTML = categories.map(c => `<option value="${c}">`).join('');
}

function getPasswordStatus(expiryDate) {
    if (!expiryDate) return 'safe';
    const today = new Date();
    const expiry = expiryDate.toDate();
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'safe';
}

function getCategoryColor(category) {
    const colors = {
        'Redes Sociales': '#3b5998',
        'Banco': '#28a745',
        'Email': '#dc3545',
        'Trabajo': '#6f42c1',
        'Compras': '#fd7e14'
    };
    return colors[category] || '#667eea';
}
// #endregion

// #region Utilities

function formatDate(expiryDate) {
    return expiryDate.toDate().toISOString().substring(0,10);
}

function togglePassword(id, password) {
    const element = document.getElementById(`pwd-${id}`);
    if (element.textContent === '••••••••') {
        element.textContent = password;
        setTimeout(() => element.textContent = '••••••••', 5000);
    } else {
        element.textContent = '••••••••';
    }
}

function togglePasswordVisibility() {
    const input = document.getElementById('password');
    const icon = document.getElementById('toggleIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function copyPassword(password) {
    navigator.clipboard.writeText(password);
    alert('Contraseña copiada al portapapeles');
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('password').value = password;
}

function exit() {
    auth.signOut().then(() => {
		document.location.href ='index.html';
	}).catch((error)=>{
	   alert('Error al cerrar la sesión: ' + error.message);
	});
}
// #endregion

// #region Event listeners
document.getElementById('searchInput').addEventListener('input', renderPasswords);
document.getElementById('categoryFilter').addEventListener('change', renderPasswords);
document.getElementById('statusFilter').addEventListener('change', renderPasswords);

document.getElementById('addPasswordModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('passwordForm').reset();
    document.getElementById('passwordId').value = '';
    document.getElementById('modalTitle').textContent = 'Agregar Contraseña';
});
// #endregion