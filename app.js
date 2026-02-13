// State
let currentUser = null;
let currentCardId = null;
const cards = [];

// DOM Elements
const authSection = document.getElementById('authSection');
const walletSection = document.getElementById('walletSection');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authError = document.getElementById('authError');
const addCardBtn = document.getElementById('addCardBtn');
const addCardModal = document.getElementById('addCardModal');
const cardDetailModal = document.getElementById('cardDetailModal');
const cardsGrid = document.getElementById('cardsGrid');
const emptyState = document.getElementById('emptyState');
const totalBalance = document.getElementById('totalBalance');
const cardCount = document.getElementById('cardCount');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initAuthListeners();
    initFormListeners();
    initCardFormListeners();
    
    // Check auth state
    firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            showWalletSection();
            loadUserCards();
        } else {
            currentUser = null;
            showAuthSection();
        }
    });
});

// Auth Functions
function initAuthListeners() {
    loginBtn.addEventListener('click', handleLogin);
    signupBtn.addEventListener('click', handleSignup);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Enter key support
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showError('Inserisci email e password');
        return;
    }
    
    try {
        await firebaseAuth.signInWithEmailAndPassword(email, password);
        clearAuthInputs();
        showToast('Accesso effettuato!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showError(getErrorMessage(error.code));
    }
}

async function handleSignup() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showError('Inserisci email e password');
        return;
    }
    
    if (password.length < 6) {
        showError('La password deve essere di almeno 6 caratteri');
        return;
    }
    
    try {
        await firebaseAuth.createUserWithEmailAndPassword(email, password);
        clearAuthInputs();
        showToast('Account creato con successo!', 'success');
    } catch (error) {
        console.error('Signup error:', error);
        showError(getErrorMessage(error.code));
    }
}

async function handleLogout() {
    try {
        await firebaseAuth.signOut();
        cards.length = 0;
        showToast('Disconnesso', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Errore durante la disconnessione', 'error');
    }
}

function clearAuthInputs() {
    emailInput.value = '';
    passwordInput.value = '';
    authError.textContent = '';
    authError.classList.remove('show');
}

function showError(message) {
    authError.textContent = message;
    authError.classList.add('show');
}

function getErrorMessage(code) {
    const messages = {
        'auth/invalid-email': 'Email non valida',
        'auth/user-disabled': 'Account disabilitato',
        'auth/user-not-found': 'Utente non trovato',
        'auth/wrong-password': 'Password errata',
        'auth/email-already-in-use': 'Email già registrata',
        'auth/weak-password': 'Password troppo debole',
        'auth/network-request-failed': 'Errore di connessione'
    };
    return messages[code] || 'Si è verificato un errore';
}

// UI Functions
function showAuthSection() {
    authSection.style.display = 'flex';
    walletSection.style.display = 'none';
    logoutBtn.style.display = 'none';
}

function showWalletSection() {
    authSection.style.display = 'none';
    walletSection.style.display = 'block';
    logoutBtn.style.display = 'flex';
}

// Card Functions
async function loadUserCards() {
    if (!currentUser) return;
    
    try {
        const snapshot = await firebaseDB
            .collection('users')
            .doc(currentUser.uid)
            .collection('cards')
            .orderBy('createdAt', 'desc')
            .get();
        
        cards.length = 0;
        snapshot.forEach(doc => {
            cards.push({ id: doc.id, ...doc.data() });
        });
        
        renderCards();
        updateBalance();
    } catch (error) {
        console.error('Error loading cards:', error);
        showToast('Errore nel caricamento delle carte', 'error');
    }
}

function renderCards() {
    cardsGrid.innerHTML = '';
    
    if (cards.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    cards.forEach(card => {
        const cardElement = createCardElement(card);
        cardsGrid.appendChild(cardElement);
    });
}

function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card-item';
    div.onclick = () => showCardDetail(card.id);
    
    const maskedNumber = maskCardNumber(card.number);
    const balance = formatCurrency(card.balance || 0);
    
    div.innerHTML = `
        <div class="card-mini ${card.type}">
            <div class="card-chip-mini"></div>
            <div class="card-number-mini">${maskedNumber}</div>
            <div class="card-info-mini">
                <div class="card-holder-mini">${card.holder}</div>
                <div class="card-expiry-mini">${card.expiry}</div>
            </div>
        </div>
        <div class="card-meta">
            <span>${getCardTypeName(card.type)}</span>
            <span class="card-balance">${balance}</span>
        </div>
    `;
    
    return div;
}

function maskCardNumber(number) {
    const cleaned = number.replace(/\s/g, '');
    const lastFour = cleaned.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function getCardTypeName(type) {
    const names = {
        'visa': 'Visa',
        'mastercard': 'Mastercard',
        'amex': 'American Express',
        'other': 'Altra'
    };
    return names[type] || 'Carta';
}

function updateBalance() {
    const total = cards.reduce((sum, card) => sum + (card.balance || 0), 0);
    totalBalance.textContent = formatCurrency(total);
    cardCount.textContent = `${cards.length} ${cards.length === 1 ? 'carta' : 'carte'}`;
}

// Modal Functions
function initFormListeners() {
    document.getElementById('addCardBtn').addEventListener('click', openAddCardModal);
    document.getElementById('refreshBtn').addEventListener('click', loadUserCards);
}

function openAddCardModal() {
    addCardModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAddCardModal() {
    addCardModal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('addCardForm').reset();
    updateCardPreview();
}

function showCardDetail(cardId) {
    currentCardId = cardId;
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    const maskedNumber = maskCardNumber(card.number);
    
    document.getElementById('detailNumber').textContent = maskedNumber;
    document.getElementById('detailHolder').textContent = card.holder;
    document.getElementById('detailExpiry').textContent = card.expiry;
    document.getElementById('detailBalance').textContent = formatCurrency(card.balance || 0);
    document.getElementById('detailType').textContent = getCardTypeName(card.type);
    
    const preview = document.getElementById('cardDetailPreview');
    preview.className = `card-preview large ${card.type}`;
    
    cardDetailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCardDetailModal() {
    cardDetailModal.classList.remove('active');
    document.body.style.overflow = '';
    currentCardId = null;
}

async function deleteCurrentCard() {
    if (!currentCardId || !currentUser) return;
    
    if (!confirm('Sei sicuro di voler eliminare questa carta?')) return;
    
    try {
        await firebaseDB
            .collection('users')
            .doc(currentUser.uid)
            .collection('cards')
            .doc(currentCardId)
            .delete();
        
        closeCardDetailModal();
        await loadUserCards();
        showToast('Carta eliminata', 'success');
    } catch (error) {
        console.error('Error deleting card:', error);
        showToast('Errore durante l\'eliminazione', 'error');
    }
}

// Card Form
function initCardFormListeners() {
    const form = document.getElementById('addCardForm');
    const cardNumber = document.getElementById('cardNumber');
    const cardHolder = document.getElementById('cardHolder');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardType = document.getElementById('cardType');
    
    // Format card number
    cardNumber.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        value = value.replace(/\D/g, '');
        value = value.substring(0, 16);
        
        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formatted;
        
        updateCardPreview();
    });
    
    // Format card holder
    cardHolder.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
        updateCardPreview();
    });
    
    // Format expiry
    cardExpiry.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
        updateCardPreview();
    });
    
    // Update preview on type change
    cardType.addEventListener('change', updateCardPreview);
    
    // Submit form
    form.addEventListener('submit', handleAddCard);
}

function updateCardPreview() {
    const number = document.getElementById('cardNumber').value || '•••• •••• •••• ••••';
    const holder = document.getElementById('cardHolder').value || 'NOME COGNOME';
    const expiry = document.getElementById('cardExpiry').value || 'MM/AA';
    const type = document.getElementById('cardType').value;
    
    document.getElementById('previewNumber').textContent = number;
    document.getElementById('previewHolder').textContent = holder;
    document.getElementById('previewExpiry').textContent = expiry;
    
    const preview = document.getElementById('cardPreview');
    preview.className = `card-preview ${type}`;
}

async function handleAddCard(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const number = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const holder = document.getElementById('cardHolder').value;
    const expiry = document.getElementById('cardExpiry').value;
    const cvv = document.getElementById('cardCVV').value;
    const balance = parseFloat(document.getElementById('cardBalance').value) || 0;
    const type = document.getElementById('cardType').value;
    
    // Validation
    if (number.length !== 16) {
        showToast('Numero carta non valido', 'error');
        return;
    }
    
    if (!holder || holder.length < 3) {
        showToast('Nome titolare non valido', 'error');
        return;
    }
    
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        showToast('Data scadenza non valida', 'error');
        return;
    }
    
    if (cvv.length !== 3) {
        showToast('CVV non valido', 'error');
        return;
    }
    
    try {
        // Encrypt sensitive data (in production, use proper encryption)
        const cardData = {
            number: number, // In produzione, cripta questo dato
            holder: holder,
            expiry: expiry,
            balance: balance,
            type: type,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await firebaseDB
            .collection('users')
            .doc(currentUser.uid)
            .collection('cards')
            .add(cardData);
        
        closeAddCardModal();
        await loadUserCards();
        showToast('Carta aggiunta con successo!', 'success');
    } catch (error) {
        console.error('Error adding card:', error);
        showToast('Errore durante l\'aggiunta della carta', 'error');
    }
}

// Toast
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Global functions for modal control
window.openAddCardModal = openAddCardModal;
window.closeAddCardModal = closeAddCardModal;
window.closeCardDetailModal = closeCardDetailModal;
window.deleteCurrentCard = deleteCurrentCard;
