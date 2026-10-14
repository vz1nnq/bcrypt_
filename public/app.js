const authView = document.querySelector('#auth-view');
const profileView = document.querySelector('#profile-view');
const form = document.querySelector('#auth-form');
const formMessage = document.querySelector('#form-message');
const submitButton = document.querySelector('#submit-button');
const submitLabel = document.querySelector('#submit-label');
const nameField = document.querySelector('#name-field');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const passwordHint = document.querySelector('#password-hint');
const title = document.querySelector('#form-title');
const description = document.querySelector('#form-description');
const tabs = document.querySelectorAll('.tab');
let mode = 'login';

function showMessage(element, message, success = false) {
  element.textContent = message;
  element.classList.toggle('is-success', success);
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === 'register';
  nameField.hidden = !registering;
  nameInput.required = registering;
  passwordInput.autocomplete = registering ? 'new-password' : 'current-password';
  passwordInput.minLength = registering ? 6 : 1;
  passwordHint.hidden = !registering;
  title.textContent = registering ? 'Crie sua conta' : 'Acesse sua conta';
  description.textContent = registering
    ? 'Preencha seus dados para começar.'
    : 'Que bom ter você por aqui novamente.';
  submitLabel.textContent = registering ? 'Criar minha conta' : 'Entrar na minha conta';
  showMessage(formMessage, '');
  tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.mensagem || 'Não foi possível concluir sua solicitação. Tente novamente.');
  }
  return data;
}

async function loadProfile(token) {
  const profile = await request('/contas/perfil', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!profile || !profile.nome || !profile.email) {
    throw new Error('Não foi possível carregar os dados da conta.');
  }
  document.querySelector('#profile-name').textContent = profile.nome;
  document.querySelector('#profile-email').textContent = profile.email;
  document.querySelector('#profile-avatar').textContent = profile.nome.trim().charAt(0).toUpperCase();
  authView.hidden = true;
  profileView.hidden = false;
}

tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));

document.querySelector('#password-toggle').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const showing = passwordInput.type === 'text';
  passwordInput.type = showing ? 'password' : 'text';
  button.textContent = showing ? 'Mostrar' : 'Ocultar';
  button.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(formMessage, '');

  if (!form.reportValidity()) return;
  if (mode === 'register' && passwordInput.value.length < 6) {
    showMessage(formMessage, 'A senha precisa ter pelo menos 6 caracteres.');
    passwordInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitLabel.textContent = mode === 'register' ? 'Criando sua conta...' : 'Verificando acesso...';

  try {
    if (mode === 'register') {
      await request('/contas/registrar', {
        method: 'POST',
        body: JSON.stringify({
          nome: nameInput.value.trim(),
          email: emailInput.value.trim(),
          senha: passwordInput.value,
        }),
      });
      const registeredEmail = emailInput.value.trim();
      form.reset();
      emailInput.value = registeredEmail;
      setMode('login');
      showMessage(formMessage, 'Conta criada! Agora entre com seu e-mail e senha.', true);
      passwordInput.focus();
    } else {
      const result = await request('/contas/login', {
        method: 'POST',
        body: JSON.stringify({
          email: emailInput.value.trim(),
          senha: passwordInput.value,
        }),
      });
      if (!result.token) throw new Error('O servidor não retornou um token de acesso.');
      sessionStorage.setItem('chave-token', result.token);
      await loadProfile(result.token);
    }
  } catch (error) {
    if (mode === 'login') sessionStorage.removeItem('chave-token');
    showMessage(formMessage, error.message || 'Erro de conexão. Confira se o servidor está ativo.');
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = mode === 'register' ? 'Criar minha conta' : 'Entrar na minha conta';
  }
});

document.querySelector('#logout-button').addEventListener('click', () => {
  sessionStorage.removeItem('chave-token');
  profileView.hidden = true;
  authView.hidden = false;
  form.reset();
  setMode('login');
  showMessage(formMessage, 'Você saiu da sua conta.', true);
  emailInput.focus();
});

const savedToken = sessionStorage.getItem('chave-token');
if (savedToken) {
  loadProfile(savedToken).catch((error) => {
    sessionStorage.removeItem('chave-token');
    showMessage(formMessage, `${error.message} Entre novamente para continuar.`);
  });
}
