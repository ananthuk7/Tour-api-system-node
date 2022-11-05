/* eslint-disable*/
import '@babel/polyfill';
import axios from 'axios';
const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    console.log(res);
  } catch (err) {
    console.log(err);
  }
};

