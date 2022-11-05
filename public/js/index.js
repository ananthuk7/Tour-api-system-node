/* eslint-disable*/
import { login } from './login';
console.log('hello from bundler');
document.querySelector('.form').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
